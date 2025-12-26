
export enum Language {
  ENGLISH = 'English',
  HINDI = 'Hindi',
  MARATHI = 'Marathi',
  TELUGU = 'Telugu',
  TAMIL = 'Tamil',
  BENGALI = 'Bengali',
  KANNADA = 'Kannada',
  GUJARATI = 'Gujarati',
  MALAYALAM = 'Malayalam'
}

export enum Subject {
  MATH = 'Mathematics',
  SCIENCE = 'Science',
  HISTORY = 'History',
  GEOGRAPHY = 'Geography',
  ENGLISH_LIT = 'English Literature',
  GENERAL = 'General Knowledge'
}

export enum Board {
  CBSE = 'CBSE (NCERT)',
  STATE = 'State Board',
  ICSE = 'ICSE',
  IB = 'IB / IGCSE'
}

export enum ChatMode {
  NORMAL = 'Normal',
  EDUCATIONAL = 'Educational'
}

export enum Tone {
  TEACHER = 'Teacher',
  FRIEND = 'Friend (Dost)'
}

export interface UserContext {
  name: string;
  language: Language;
  // Grade, Subject, Board, and Tone are optional/specific to usage
  grade?: number;
  subject?: Subject;
  board?: Board;
  tone?: Tone;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string
  timestamp: Date;
  isError?: boolean;
}

export interface QuizScore {
  topic: string;
  score: string; // e.g., "4/5"
  timestamp: number;
}

export interface SavedSession {
  id: string;
  title: string;
  timestamp: number;
  messages: ChatMessage[];
  context: UserContext;
  mode: ChatMode;
  quizScores?: QuizScore[];
}

export interface TopicMetric {
  topic: string; // The display name
  count: number;
  lastAsked: number;
}