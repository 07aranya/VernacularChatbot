import { GoogleGenAI, type Content, type Part } from '@google/genai';
import type { QuotaConfig } from './quota.js';

export interface ServerUserContext {
  name: string;
  language: string;
  grade?: number;
  subject?: string;
  board?: string;
  chapter?: string;
  tone?: string;
  difficulty?: string;
}

export interface ServerHistoryItem {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

export interface ServerQuizScore {
  topic: string;
  score: string;
  timestamp: number;
}

export interface ChatApiPayload {
  action: 'chat' | 'quiz' | 'report';
  context: ServerUserContext;
  mode: 'Normal' | 'Educational';
  history?: ServerHistoryItem[];
  message?: string;
  imageBase64?: string;
  topic?: string;
  quizScores?: ServerQuizScore[];
}

export class RequestValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'RequestValidationError';
    this.status = status;
  }
}

export const getServerApiKey = (): string | undefined => {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.VITE_GEMINI_API_KEY;
  return key && key.trim() ? key.trim() : undefined;
};

const parseBase64Image = (
  imageBase64: string,
  maxBytes: number
): { inlineData: { mimeType: string; data: string } } => {
  let mimeType = 'image/jpeg';
  let data = imageBase64;

  if (imageBase64.startsWith('data:')) {
    const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      data = matches[2];
    } else {
      data = imageBase64.split(',')[1] || '';
    }
  }

  if (!data) {
    throw new RequestValidationError('Invalid image attachment format.');
  }

  const approxBytes = Math.floor((data.length * 3) / 4);
  if (approxBytes > maxBytes) {
    throw new RequestValidationError(
      `Image is too large (${Math.round(approxBytes / 1024)} KB). Maximum allowed is ${Math.round(
        maxBytes / (1024 * 1024)
      )} MB.`,
      413
    );
  }

  return { inlineData: { mimeType, data } };
};

const buildSystemInstruction = (
  context: ServerUserContext,
  mode: 'Normal' | 'Educational'
): string => {
  const tone = context.tone || 'Teacher';
  const difficulty = context.difficulty || 'Intermediate';
  const isFriend = tone === 'Friend (Dost)';

  let langInstruction = 'Respond in clear, simple English.';
  let toneInstruction = 'Maintain a polite, encouraging, and academic tone.';

  if (isFriend) {
    toneInstruction = `
      ACT LIKE A BEST FRIEND ("Dost" or "Yaar").
      - Do NOT sound like a robot or a teacher.
      - Use casual language, slang, and enthusiasm.
      - Use emojis liberally.
      - Start answers with things like "Dekh bhai", "Listen buddy", "Arre sun", "Mitr".
      - Simplify concepts using real-life funny examples.
    `;
  }

  let difficultyInstruction = '';
  switch (difficulty) {
    case 'Beginner':
      difficultyInstruction =
        "EXPLAIN LIKE I'M 5. Use very simple words, lots of analogies, and avoid heavy jargon. Go step-by-step.";
      break;
    case 'Advanced':
      difficultyInstruction =
        'EXPLAIN AT AN ADVANCED LEVEL. Use technical terminology, go into depth, and assume the user has strong foundational knowledge. Challenge the user.';
      break;
    default:
      difficultyInstruction =
        'EXPLAIN AT A STANDARD SCHOOL LEVEL. Balance simplicity with correct terminology.';
      break;
  }

  switch (context.language) {
    case 'Hindi':
      langInstruction = isFriend
        ? "Respond in Hinglish (Hindi + English mix) or casual Hindi. Use words like 'Bhai', 'Yaar', 'Mast'."
        : 'Respond primarily in Hindi (Devanagari script). You can use English technical terms in parentheses if needed.';
      break;
    case 'Marathi':
      langInstruction = isFriend
        ? "Respond in casual Marathi. Use words like 'Mitra', 'Bhau', 'Arey'. Use simple day-to-day Marathi."
        : 'Respond primarily in Marathi (Devanagari script). Use simple but correct Marathi.';
      break;
    default:
      if (context.language && context.language !== 'English') {
        langInstruction = `Respond primarily in ${context.language}.`;
      }
      break;
  }

  const diagramInstruction = `
    VISUALS & DIAGRAMS:
    - You can DRAW diagrams to explain concepts (geometry, science cycles, graphs, flowcharts).
    - To draw, generate valid, standalone SVG code.
    - Wrap the SVG code strictly in a markdown code block labeled 'svg'. Example:
      \`\`\`svg
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">...</svg>
      \`\`\`
    - Ensure the SVG is responsive (use viewBox), uses high-contrast colors (black strokes, simple fills), and has readable text labels if needed.
    - If the user asks for a diagram (e.g. "Draw a triangle", "Show me the water cycle"), ALWAYS provide this SVG block.
  `;

  const mathInstruction = `
    MATH & FORMULA FORMATTING:
    - ALWAYS use LaTeX formatting for mathematical equations and formulas.
    - Enclose inline math in single dollar signs (e.g., $E = mc^2$).
    - Enclose block/display math in double dollar signs (e.g., $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$).
    - Do NOT use raw text representations like "sqrt()" or "x^2" or "1/2" for complex fractions. Use LaTeX: $\\sqrt{...}$, $x^2$, $\\frac{1}{2}$.
    - For complex derivations, use block math $$...$$ to center them.
  `;

  const analyticsInstruction = `
    ANALYTICS TAGGING (IMPORTANT):
    - We are tracking what topics students are confused about.
    - If the user asks an educational question (e.g., "Explain photosynthesis", "How to solve quadratic equations", "What is gravity?"), YOU MUST identify the main academic topic.
    - Append the topic to the very end of your response in this strict hidden format: [[TOPIC: Topic Name]]
    - Example 1: User: "What is Newton's third law?" -> Response: "Action and reaction are equal... [[TOPIC: Newton's Laws]]"
    - Keep topic names consistent and short.
  `;

  const adaptiveDifficultyInstruction = `
    ADAPTIVE DIFFICULTY (CRITICAL):
    - Monitor the user's questions and responses.
    - If the user seems to be STRUGGLING, asking for simpler explanations, or getting things wrong frequently, you MUST output this tag at the end: [[AUTO_DIFF: Beginner]]
    - If the user seems ADVANCED, asking deep conceptual questions, or showing boredom with simple answers, you MUST output this tag at the end: [[AUTO_DIFF: Advanced]]
    - If the level is appropriate, do not output any tag.
  `;

  if (mode === 'Normal') {
    return `
      You are YourBuddy.
      ${langInstruction}
      ${toneInstruction}
      ${diagramInstruction}
      ${mathInstruction}
      ${analyticsInstruction}
      Your goal is to have casual conversations with ${context.name || 'Student'}.

      IMPORTANT: If the user asks a question that is clearly educational, academic, or related to school curriculum, prefix your response with exactly "[[SWITCH_TO_EDU]] " and then answer normally (including the [[TOPIC: ...]] tag).
    `;
  }

  const gradeStr = context.grade ? `Grade ${context.grade}` : 'school';
  const subjectStr = context.subject ? context.subject : 'general subjects';
  const boardStr = context.board || 'CBSE (NCERT)';
  const chapterStr = context.chapter
    ? `FOCUS CHAPTER: ${context.chapter}`
    : 'No specific chapter focus.';

  let curriculumInstruction = `Follow the ${boardStr} curriculum guidelines. ${chapterStr}`;
  if (boardStr === 'CBSE (NCERT)') {
    curriculumInstruction += `
      \nSTRICTLY ADHERE TO THE NCERT SYLLABUS for ${gradeStr}.
      - When defining terms, use definitions found in standard NCERT textbooks.
      - Use examples common in Indian NCERT textbooks.
    `;
  }

  return `
    You are YourBuddy, an expert AI tutor for ${gradeStr} focusing on ${subjectStr}.
    Current Difficulty Level: ${difficulty}
    ${difficultyInstruction}
    ${langInstruction}
    ${toneInstruction}
    ${diagramInstruction}
    ${mathInstruction}
    ${analyticsInstruction}
    ${adaptiveDifficultyInstruction}

    You are acting as a strict adherent to the ${boardStr} syllabus.
    ${curriculumInstruction}

    Guidelines:
    1. Adapt complexity to ${gradeStr} level.
    2. Use analogies relevant to India.
    3. Break down complex topics into bullet points.
    4. Always end with a follow-up question to check understanding.
    5. Keep responses concise (under 200 words).
    6. Format math formulas clearly using LaTeX ($...$ or $$...$$).
  `;
};

const buildGeminiHistory = (
  history: ServerHistoryItem[] | undefined,
  cfg: QuotaConfig
): Content[] => {
  if (!Array.isArray(history) || history.length === 0) return [];

  const trimmed = history.slice(-cfg.maxHistoryMessages);
  const contents: Content[] = [];

  for (const msg of trimmed) {
    if (!msg || (msg.role !== 'user' && msg.role !== 'model')) continue;
    const text = typeof msg.text === 'string' ? msg.text.slice(0, cfg.maxMessageChars) : '';
    if (!text && !msg.image) continue;

    // Omit images from historical turns to keep token usage within quota caps
    const parts: Part[] = [];
    if (text) {
      parts.push({ text });
    } else if (msg.image) {
      parts.push({ text: '[Uploaded image in earlier turn]' });
    }

    if (parts.length > 0) {
      contents.push({ role: msg.role, parts });
    }
  }

  return contents;
};

export interface PreparedTutorRequest {
  apiKey: string;
  systemInstruction: string;
  history: Content[];
  userParts: Part[];
  maxOutputTokens: number;
}

/**
 * Validates payload & enforces message/image/history bounds before consuming quota.
 */
export const prepareTutorRequest = (
  payload: ChatApiPayload,
  cfg: QuotaConfig
): PreparedTutorRequest => {
  const apiKey = getServerApiKey();
  if (!apiKey) {
    throw new RequestValidationError(
      'Server Gemini API key is not configured (set GEMINI_API_KEY in Vercel Environment Variables).',
      503
    );
  }

  if (!payload || !payload.context) {
    throw new RequestValidationError('Missing student context.');
  }

  const systemInstruction = buildSystemInstruction(payload.context, payload.mode || 'Normal');
  const history = buildGeminiHistory(payload.history, cfg);

  let userParts: Part[] = [];
  let maxOutputTokens = cfg.maxOutputTokens;

  if (payload.action === 'quiz') {
    const topic = (payload.topic || 'The last discussed topic').slice(0, 200);
    userParts = [
      {
        text: `
          GENERATE A SYLLABUS-LOCKED QUIZ.
          Topic: ${topic}
          Format: 5 Multiple Choice Questions (MCQs).
          Constraint: Questions must be strictly based on the NCERT/State Board textbook content for this grade level. Do not ask outside general knowledge.

          Output Format:
          1. Question (Use LaTeX for math)
          A) Option
          B) Option
          C) Option
          D) Option

          (Do not give answers immediately. Ask the user to attempt them first.)

          IMPORTANT INSTRUCTION FOR SCORING:
          After the user has answered the questions and you have provided the feedback/explanations, you MUST conclude the quiz by explicitly stating the final score in this EXACT hidden format:
          [[QUIZ_SCORE: X/5]]
        `
      }
    ];
  } else if (payload.action === 'report') {
    maxOutputTokens = Math.min(cfg.maxOutputTokens, 500);
    const scores = Array.isArray(payload.quizScores) ? payload.quizScores.slice(-10) : [];
    const scoreContext =
      scores.length > 0
        ? `Here are the recorded quiz scores for this session:\n${scores
            .map((q) => `- ${String(q.topic).slice(0, 80)}: ${String(q.score).slice(0, 20)}`)
            .join('\n')}`
        : 'No formal quizzes were recorded in this session.';

    userParts = [
      {
        text: `
          Generate a short, fun, and emoji-rich 'Progress Report' for ${
            (payload.context.name || 'Student').slice(0, 60)
          } to share on WhatsApp with parents.
          Context:
          ${scoreContext}
          Start strictly with: "📢 *YourBuddy Study Update* 📢"
        `
      }
    ];
  } else if (payload.action === 'chat' || !payload.action) {
    const message = typeof payload.message === 'string' ? payload.message.trim() : '';
    if (!message && !payload.imageBase64) {
      throw new RequestValidationError('Message or image is required.');
    }
    if (message.length > cfg.maxMessageChars) {
      throw new RequestValidationError(
        `Message exceeds maximum length of ${cfg.maxMessageChars} characters.`
      );
    }

    if (payload.imageBase64) {
      userParts.push(parseBase64Image(payload.imageBase64, cfg.maxImageBytes));
    }
    userParts.push({ text: message || 'Analyze this image.' });
  } else {
    throw new RequestValidationError(`Unsupported action: ${String(payload.action)}`);
  }

  return {
    apiKey,
    systemInstruction,
    history,
    userParts,
    maxOutputTokens
  };
};

/**
 * Executes a prepared, token-capped Gemini request using the server-side API key.
 */
export const executePreparedTutorRequest = async (
  prepared: PreparedTutorRequest
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: prepared.apiKey });

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: prepared.systemInstruction,
      temperature: 0.7,
      maxOutputTokens: prepared.maxOutputTokens
    },
    history: prepared.history
  });

  const response = await chat.sendMessage({
    message:
      prepared.userParts.length === 1 && prepared.userParts[0].text
        ? prepared.userParts[0].text
        : prepared.userParts
  });

  return response.text || "I'm sorry, I couldn't generate a response.";
};
