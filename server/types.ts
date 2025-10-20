import type { StructuredGoogleDoc, WorkProfile } from '../types';

export interface StoredWorkProfile extends WorkProfile {
  createdAt: string;
  updatedAt: string;
  document: StructuredGoogleDoc;
}

export interface GoogleDocIngestPayload {
  url?: string;
  docId?: string;
}