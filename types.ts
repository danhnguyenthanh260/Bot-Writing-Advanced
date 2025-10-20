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

export interface GoogleDocSection {
  heading: string;
  level: number;
  paragraphs: string[];
}

export interface StructuredGoogleDoc {
  docId: string;
  title: string;
  revisionId?: string;
  plainText: string;
  wordCount: number;
  outline: GoogleDocSection[];
  lastUpdated?: string;
}

// Represents the AI's deep analysis of a single literary work.
export interface WorkProfile {
  id: string;
  googleDocUrl: string;
  docId?: string;
  title: string;
  summary: string;
  totalChapters: number;
  writingStyle: string;
  authorHabits: string[];
  lastAnalyzedChapter: number;
  outline?: GoogleDocSection[];
  rawText?: string;
  lastSyncedAt?: string;
  document?: StructuredGoogleDoc;
  // To link pages to this specific work
  pageIds: string[]; 
}

export interface DocumentContextForAI {
  title: string;
  summary?: string;
  plainText: string;
  outline?: GoogleDocSection[];
  wordCount?: number;
}

export interface GoogleDocIngestResponse {
  docId: string;
  document: StructuredGoogleDoc;
  workProfile: WorkProfile;
}