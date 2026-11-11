import { GoogleGenAI, Chat, Content } from "@google/genai";
import { UserContext, Language, ChatMode, Board, Tone, ChatMessage, QuizScore, DifficultyLevel } from "../types";

let aiInstance: GoogleGenAI | null = null;

const getAIInstance = (): GoogleGenAI => {
  if (!aiInstance) {
    if (!process.env.API_KEY) {
      throw new Error("API Key not found");
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
};

export const createChatSession = (context: UserContext, mode: ChatMode, historyMessages?: ChatMessage[]): Chat => {
  const ai = getAIInstance();
  
  let systemInstruction = "";
  const tone = context.tone || Tone.TEACHER;
  const difficulty = context.difficulty || DifficultyLevel.INTERMEDIATE;

  // Language & Tone Logic
  let langInstruction = "Respond in clear, simple English.";
  let toneInstruction = "Maintain a polite, encouraging, and academic tone.";

  // Friend Mode Instructions (Slang/Casual)
  if (tone === Tone.FRIEND) {
     toneInstruction = `
      ACT LIKE A BEST FRIEND ("Dost" or "Yaar"). 
      - Do NOT sound like a robot or a teacher.
      - Use casual language, slang, and enthusiasm.
      - Use emojis liberally.
      - Start answers with things like "Dekh bhai", "Listen buddy", "Arre sun", "Mitr".
      - Simplify concepts using real-life funny examples.
     `;
  }

  // Difficulty Logic
  let difficultyInstruction = "";
  switch (difficulty) {
    case DifficultyLevel.BEGINNER:
      difficultyInstruction = "EXPLAIN LIKE I'M 5. Use very simple words, lots of analogies, and avoid heavy jargon. Go step-by-step.";
      break;
    case DifficultyLevel.ADVANCED:
      difficultyInstruction = "EXPLAIN AT AN ADVANCED LEVEL. Use technical terminology, go into depth, and assume the user has strong foundational knowledge. Challenge the user.";
      break;
    default:
      difficultyInstruction = "EXPLAIN AT A STANDARD SCHOOL LEVEL. Balance simplicity with correct terminology.";
      break;
  }

  // Language Specifics (combining with tone)
  switch (context.language) {
    case Language.HINDI:
      langInstruction = tone === Tone.FRIEND 
        ? "Respond in Hinglish (Hindi + English mix) or casual Hindi. Use words like 'Bhai', 'Yaar', 'Mast'."
        : "Respond primarily in Hindi (Devanagari script). You can use English technical terms in parentheses if needed.";
      break;
    case Language.MARATHI:
      langInstruction = tone === Tone.FRIEND
        ? "Respond in casual Marathi. Use words like 'Mitra', 'Bhau', 'Arey'. Use simple day-to-day Marathi."
        : "Respond primarily in Marathi (Devanagari script). Use simple but correct Marathi.";
      break;
    // ... (Keep other languages as standard for now, can be expanded for slang later)
    default:
      if (context.language !== Language.ENGLISH) {
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
    - Enclose block/display math in double dollar signs (e.g., $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$).
    - Do NOT use raw text representations like "sqrt()" or "x^2" or "1/2" for complex fractions. Use LaTeX: $\sqrt{...}$, $x^2$, $\frac{1}{2}$.
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
    - If the user seems to be STRUGGLING, asking for simpler explanations, or getting things wrong frequently, you MUST output this tag at the end: [[AUTO_DIFF: ${DifficultyLevel.BEGINNER}]]
    - If the user seems ADVANCED, asking deep conceptual questions, or showing boredom with simple answers, you MUST output this tag at the end: [[AUTO_DIFF: ${DifficultyLevel.ADVANCED}]]
    - If the level is appropriate, do not output any tag.
  `;

  if (mode === ChatMode.NORMAL) {
    systemInstruction = `
      You are YourBuddy.
      ${langInstruction}
      ${toneInstruction}
      ${diagramInstruction}
      ${mathInstruction}
      ${analyticsInstruction}
      Your goal is to have casual conversations with ${context.name}.
      
      IMPORTANT: If the user asks a question that is clearly educational, academic, or related to school curriculum, prefix your response with exactly "[[SWITCH_TO_EDU]] " and then answer normally (including the [[TOPIC: ...]] tag).
    `;
  } else {
    // Educational Mode
    const gradeStr = context.grade ? `Grade ${context.grade}` : "school";
    const subjectStr = context.subject ? context.subject : "general subjects";
    const boardStr = context.board || Board.CBSE;
    const chapterStr = context.chapter ? `FOCUS CHAPTER: ${context.chapter}` : "No specific chapter focus.";
    
    // Board-specific instructions
    let curriculumInstruction = `Follow the ${boardStr} curriculum guidelines. ${chapterStr}`;
    
    if (boardStr === Board.CBSE) {
      curriculumInstruction += `
        \nSTRICTLY ADHERE TO THE NCERT SYLLABUS for ${gradeStr}.
        - When defining terms, use definitions found in standard NCERT textbooks.
        - Use examples common in Indian NCERT textbooks.
      `;
    }

    systemInstruction = `
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
  }

  // Convert ChatMessage[] to Gemini History format
  let history: Content[] | undefined = undefined;
  if (historyMessages && historyMessages.length > 0) {
    history = historyMessages
      .filter(msg => !msg.isError)
      .map(msg => {
        const parts: any[] = [];
        if (msg.image) {
          let mimeType = 'image/jpeg';
          let data = msg.image;
          
          if (msg.image.startsWith('data:')) {
            const matches = msg.image.match(/^data:([^;]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              mimeType = matches[1];
              data = matches[2];
            } else {
              data = msg.image.split(',')[1] || msg.image;
            }
          }

          parts.push({
            inlineData: { mimeType: mimeType, data: data }
          });
        }
        if (msg.text) {
          parts.push({ text: msg.text });
        }
        return {
          role: msg.role,
          parts: parts
        };
      });
  }

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7,
    },
    history: history
  });
};

// Function to generate a strict quiz
export const generateQuiz = async (chat: Chat, topic: string): Promise<string> => {
  const quizPrompt = `
    GENERATE A SYLLABUS-LOCKED QUIZ.
    Topic: ${topic || "The last discussed topic"}
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
  `;
  
  const response = await chat.sendMessage({ message: quizPrompt });
  return response.text || "Could not generate quiz.";
};

// Function to generate a progress report for WhatsApp
export const generateProgressReport = async (chat: Chat, studentName: string, quizScores?: QuizScore[]): Promise<string> => {
  let scoreContext = "";
  if (quizScores && quizScores.length > 0) {
    scoreContext = "Here are the recorded quiz scores for this session:\n";
    quizScores.forEach(q => {
      scoreContext += `- ${q.topic}: ${q.score}\n`;
    });
  } else {
    scoreContext = "No formal quizzes were recorded in this session.";
  }

  const prompt = `
    Generate a short, fun, and emoji-rich 'Progress Report' for ${studentName} to share on WhatsApp with parents.
    Context:
    ${scoreContext}
    Start strictly with: "📢 *YourBuddy Study Update* 📢"
  `;
  const response = await chat.sendMessage({ message: prompt });
  return response.text || "Check out my study progress on YourBuddy!";
};

export const sendMessageToGemini = async (chat: Chat, message: string, imageBase64?: string): Promise<string> => {
  try {
    let response;
    if (imageBase64) {
      let mimeType = 'image/jpeg';
      let data = imageBase64;
      if (imageBase64.startsWith('data:')) {
        const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          data = matches[2];
        } else {
           data = imageBase64.split(',')[1];
        }
      }
      const imagePart = {
        inlineData: { mimeType: mimeType, data: data }
      };
      const textPart = { text: message || "Analyze this image." };
      response = await chat.sendMessage({ message: [imagePart, textPart] });
    } else {
      response = await chat.sendMessage({ message });
    }
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};