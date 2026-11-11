import { UserContext, ChatMode, ChatMessage, QuizScore } from '../types';

export interface QuotaSnapshot {
  dailyLimit: number;
  dailyUsed: number;
  dailyRemaining: number;
  perIpDailyLimit: number;
  perIpDailyUsed: number;
  perIpDailyRemaining: number;
  perIpMinuteLimit: number;
  perIpMinuteRemaining: number;
  maxOutputTokens: number;
  distributed: boolean;
  resetAtUtc: string;
}

export interface ServerStatus {
  configured: boolean;
  quota?: QuotaSnapshot;
}

export interface TutorSession {
  context: UserContext;
  mode: ChatMode;
  history: ChatMessage[];
}

export interface TutorApiResult {
  text: string;
  quota?: QuotaSnapshot;
}

export class TutorApiError extends Error {
  code?: string;
  status?: number;
  retryAfterSeconds?: number;
  quota?: QuotaSnapshot;

  constructor(
    message: string,
    opts?: {
      code?: string;
      status?: number;
      retryAfterSeconds?: number;
      quota?: QuotaSnapshot;
    }
  ) {
    super(message);
    this.name = 'TutorApiError';
    this.code = opts?.code;
    this.status = opts?.status;
    this.retryAfterSeconds = opts?.retryAfterSeconds;
    this.quota = opts?.quota;
  }
}

const serializeHistory = (messages: ChatMessage[]) =>
  messages
    .filter((msg) => !msg.isError && !msg.id.startsWith('sys-'))
    .map((msg) => ({
      role: msg.role,
      text: msg.text,
      image: msg.image
    }));

const callChatEndpoint = async (payload: Record<string, unknown>): Promise<TutorApiResult> => {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new TutorApiError(data?.error || `Request failed (${res.status}).`, {
      code: data?.code,
      status: res.status,
      retryAfterSeconds: data?.retryAfterSeconds,
      quota: data?.quota
    });
  }

  return {
    text: data?.text || "I'm sorry, I couldn't generate a response.",
    quota: data?.quota
  };
};

export const fetchServerStatus = async (): Promise<ServerStatus> => {
  const res = await fetch('/api/chat', { method: 'GET' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new TutorApiError(data?.error || 'Failed to check backend status.', {
      status: res.status
    });
  }
  return {
    configured: Boolean(data?.configured),
    quota: data?.quota
  };
};

export const createChatSession = (
  context: UserContext,
  mode: ChatMode,
  historyMessages?: ChatMessage[]
): TutorSession => ({
  context,
  mode,
  history: historyMessages ? [...historyMessages] : []
});

export const generateQuiz = async (
  session: TutorSession,
  topic: string
): Promise<TutorApiResult> => {
  const result = await callChatEndpoint({
    action: 'quiz',
    context: session.context,
    mode: session.mode,
    history: serializeHistory(session.history),
    topic: topic || 'The last discussed topic'
  });

  session.history.push(
    {
      id: `user-quiz-${Date.now()}`,
      role: 'user',
      text: `Take a Test / Quiz me on ${topic || 'the last discussed topic'}`,
      timestamp: new Date()
    },
    {
      id: `model-quiz-${Date.now()}`,
      role: 'model',
      text: result.text,
      timestamp: new Date()
    }
  );

  return result;
};

export const generateProgressReport = async (
  session: TutorSession,
  studentName: string,
  quizScores?: QuizScore[]
): Promise<TutorApiResult> => {
  return await callChatEndpoint({
    action: 'report',
    context: { ...session.context, name: studentName },
    mode: session.mode,
    history: serializeHistory(session.history),
    quizScores
  });
};

export const sendMessageToGemini = async (
  session: TutorSession,
  message: string,
  imageBase64?: string
): Promise<TutorApiResult> => {
  const result = await callChatEndpoint({
    action: 'chat',
    context: session.context,
    mode: session.mode,
    history: serializeHistory(session.history),
    message,
    imageBase64
  });

  session.history.push(
    {
      id: `user-${Date.now()}`,
      role: 'user',
      text: message || 'Analyze this image.',
      image: imageBase64,
      timestamp: new Date()
    },
    {
      id: `model-${Date.now()}`,
      role: 'model',
      text: result.text,
      timestamp: new Date()
    }
  );

  return result;
};
