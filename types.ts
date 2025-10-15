export interface User {
  name: string;
  avatarUrl: string;
  preferred_appellation?: string;
  learning_interests?: string[];
  learning_goals?: string[];
}

export interface Document {
  id: string;
  name:string;
  content: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface CanvasPage {
  id: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface CanvasBlock {
  id: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  pageId: string | null;
  parentId?: string | null;
}
