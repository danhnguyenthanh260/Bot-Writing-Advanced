
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
