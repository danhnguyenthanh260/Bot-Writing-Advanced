export interface User {
  name: string;
  avatarUrl: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface CanvasPage {
  id: string;
  title: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// Represents the AI's deep analysis of a single literary work.
export interface WorkProfile {
  id: string;
  googleDocUrl: string;
  title: string;
  summary: string;
  totalChapters: number;
  writingStyle: string;
  authorHabits: string[];
  lastAnalyzedChapter: number;
  // To link pages to this specific work
  pageIds: string[]; 
}