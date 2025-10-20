import { google, docs_v1 } from 'googleapis';
import type { OAuth2Client, JWT } from 'google-auth-library';
import type { StructuredGoogleDoc, WorkProfile } from '../types';

const DOCS_SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];

type AuthClient = OAuth2Client | JWT;

const normalizePrivateKey = (key: string) => key.replace(/\\n/g, '\n');

const createAuthClient = async (): Promise<AuthClient> => {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (serviceAccountEmail && serviceAccountKey) {
    return new google.auth.JWT({
      email: serviceAccountEmail,
      key: normalizePrivateKey(serviceAccountKey),
      scopes: DOCS_SCOPES,
    });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (clientId && clientSecret && refreshToken) {
    const oAuthClient = new google.auth.OAuth2({
      clientId,
      clientSecret,
      redirectUri,
    });

    oAuthClient.setCredentials({ refresh_token: refreshToken });
    return oAuthClient;
  }

  throw new Error('Google Docs credentials are not configured. Provide either service account or OAuth client secrets.');
};

export interface StructuredContentPiece {
  type: 'heading' | 'paragraph';
  text: string;
  level?: number;
}

class GoogleDocsService {
  private authClientPromise?: Promise<AuthClient>;

  async loadDocument(input: string): Promise<StructuredGoogleDoc> {
    const documentId = this.extractDocumentId(input);
    const auth = await this.getAuthClient();
    const docsApi = google.docs({ version: 'v1', auth });

    const document = await docsApi.documents.get({ documentId });
    if (!document.data) {
      throw new Error('Google Docs API returned an empty document payload.');
    }

    return this.toStructuredDocument(documentId, document.data);
  }

  extractDocumentId(input: string): string {
    const trimmed = input.trim();
    const directIdMatch = /^[a-zA-Z0-9_-]+$/.test(trimmed);
    if (directIdMatch) {
      return trimmed;
    }

    const urlMatch = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }

    throw new Error('Không thể xác định docId từ chuỗi được cung cấp.');
  }

  async getStructuredContent(input: string): Promise<{ doc: StructuredGoogleDoc; pieces: StructuredContentPiece[] }> {
    const structuredDoc = await this.loadDocument(input);
    const pieces = this.toStructuredPieces(structuredDoc);
    return { doc: structuredDoc, pieces };
  }

  private async getAuthClient(): Promise<AuthClient> {
    if (!this.authClientPromise) {
      this.authClientPromise = createAuthClient();
    }
    return this.authClientPromise;
  }

  private toStructuredDocument(documentId: string, document: docs_v1.Schema$Document): StructuredGoogleDoc {
    const outline = this.buildOutline(document.body?.content ?? []);
    const plainText = outline
      .flatMap(section => section.paragraphs)
      .join('\n\n');
    const wordCount = plainText.trim().length > 0 ? plainText.trim().split(/\s+/).length : 0;

    return {
      docId: documentId,
      title: document.title ?? 'Tài liệu không tiêu đề',
      revisionId: document.revisionId ?? undefined,
      plainText,
      wordCount,
      outline,
    };
  }

  private toStructuredPieces(doc: StructuredGoogleDoc): StructuredContentPiece[] {
    const pieces: StructuredContentPiece[] = [];
    for (const section of doc.outline) {
      if (section.heading.trim().length > 0) {
        pieces.push({ type: 'heading', text: section.heading, level: section.level });
      }
      for (const paragraph of section.paragraphs) {
        if (paragraph.trim().length > 0) {
          pieces.push({ type: 'paragraph', text: paragraph });
        }
      }
    }
    return pieces;
  }

  private buildOutline(elements: docs_v1.Schema$StructuralElement[]): StructuredGoogleDoc['outline'] {
    const outline: StructuredGoogleDoc['outline'] = [];
    let currentSection: { heading: string; level: number; paragraphs: string[] } | null = null;

    const pushSection = () => {
      if (currentSection) {
        outline.push({
          heading: currentSection.heading.trim(),
          level: currentSection.level,
          paragraphs: currentSection.paragraphs.map(p => p.trim()).filter(Boolean),
        });
      }
    };

    for (const element of elements) {
      const paragraph = element.paragraph;
      if (!paragraph) continue;

      const text = (paragraph.elements ?? [])
        .map(el => el.textRun?.content ?? '')
        .join('')
        .replace(/\s+$/g, '')
        .replace(/\s+/g, ' ');

      if (!text.trim()) {
        continue;
      }

      const namedStyle = paragraph.paragraphStyle?.namedStyleType ?? '';
      const headingLevel = this.resolveHeadingLevel(namedStyle);

      if (headingLevel !== null) {
        pushSection();
        currentSection = {
          heading: text.trim(),
          level: headingLevel,
          paragraphs: [],
        };
        continue;
      }

      if (!currentSection) {
        currentSection = {
          heading: 'Giới thiệu',
          level: 0,
          paragraphs: [],
        };
      }
      currentSection.paragraphs.push(text.trim());
    }

    pushSection();

    return outline.length > 0
      ? outline
      : [
          {
            heading: 'Nội dung',
            level: 0,
            paragraphs: ['Không tìm thấy nội dung văn bản trong tài liệu.'],
          },
        ];
  }

  private resolveHeadingLevel(namedStyle: string): number | null {
    if (!namedStyle) return null;
    if (namedStyle === 'TITLE') return 0;
    const match = namedStyle.match(/HEADING_(\d)/);
    if (match) {
      return Number(match[1]);
    }
    return null;
  }
}

export const googleDocsService = new GoogleDocsService();

export const convertGoogleDocToWorkProfile = (doc: StructuredGoogleDoc, sourceUrl: string): WorkProfile => {
  const paragraphs = doc.outline.flatMap(section => section.paragraphs);
  const summarySource = paragraphs.slice(0, 3).join(' ');
  const summary = summarySource
    ? summarySource.slice(0, 600) + (summarySource.length > 600 ? '…' : '')
    : 'Chưa thể tạo tóm tắt vì tài liệu không có nội dung đủ dài.';

  const headingLevelOneCount = doc.outline.filter(section => section.level === 1).length;
  const sentences = doc.plainText
    .split(/[.!?]+/) 
    .map(sentence => sentence.trim())
    .filter(Boolean);
  const averageSentenceLength = sentences.length > 0 ? Math.round(doc.wordCount / sentences.length) : 0;

  const writingStyleParts: string[] = [];
  writingStyleParts.push(doc.wordCount > 2500 ? 'Văn bản dài, giàu chi tiết.' : 'Văn bản súc tích, dễ theo dõi.');
  if (averageSentenceLength > 0) {
    writingStyleParts.push(`Độ dài câu trung bình khoảng ${averageSentenceLength} từ.`);
  }
  const headingDiversity = new Set(doc.outline.map(section => section.level)).size;
  if (headingDiversity > 2) {
    writingStyleParts.push('Tác giả sử dụng nhiều cấp tiêu đề để phân chia bố cục.');
  }
  const writingStyle = writingStyleParts.join(' ');

  const authorHabits: string[] = [];
  if (headingLevelOneCount > 0) {
    authorHabits.push('Thường chia chương rõ ràng với các tiêu đề cấp 1.');
  }
  if (doc.outline.some(section => section.paragraphs.some(paragraph => paragraph.length > 220))) {
    authorHabits.push('Ưa chuộng các đoạn văn dài để mô tả chi tiết.');
  }
  if (sentences.length > 0 && sentences.filter(sentence => /".+"/.test(sentence)).length / sentences.length > 0.1) {
    authorHabits.push('Sử dụng hội thoại thường xuyên trong câu chuyện.');
  }
  if (authorHabits.length === 0) {
    authorHabits.push('Phong cách viết cân bằng giữa miêu tả và hành động.');
  }

  const nowIso = new Date().toISOString();

  return {
    id: doc.docId,
    googleDocUrl: sourceUrl,
    title: doc.title,
    summary,
    totalChapters: headingLevelOneCount || doc.outline.length,
    writingStyle,
    authorHabits,
    lastAnalyzedChapter: headingLevelOneCount || doc.outline.length,
    docId: doc.docId,
    outline: doc.outline,
    rawText: doc.plainText,
    lastSyncedAt: nowIso,
    document: doc,
    pageIds: [],
  };
};

export default googleDocsService;