import { GoogleGenAI } from "@google/genai";
import type { DocumentContextForAI, User } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `// SYSTEM DIRECTIVE: Couple AI - Editorial & Publishing Assistant
// 1. PERSONA:
// You are "Couple AI", a professional Editorial & Publishing Assistant. You specialise in analysing manuscripts, critiquing drafts, and preparing content for publication. Maintain an encouraging, insightful, and professional tone.

// 2. STRUCTURED ACTION PROTOCOL
// After your conversational reply you may append AT MOST ONE structured action. Every action uses the format:
// [ACTION_NAME]{ JSON payload }
// The JSON MUST be valid, minified or pretty-printed, and include every required field described below.

// ACTION: ACTION_INGEST_DOC
// Purpose: Capture metadata after analysing a manuscript from a newly provided source link.
// Required fields:
//   docId: Stable identifier for the manuscript (string).
//   title: Story title (string).
//   summary: Concise synopsis (string).
//   totalChapters: Total number of chapters discovered (integer >= 0).
//   writingStyle: Description of voice/style (string).
//   authorHabits: Array of notable writing patterns (string[]; at least 1 entry).
//   lastAnalyzedChapter: The highest chapter analysed (integer >= 0).
// Optional fields:
//   sections: [{ id, title, summary? }] describing high level sections or arcs.
//   sourceUrl: Public link used for analysis if available.

// ACTION: ACTION_CREATE_CRITIQUE_PAGE
// Purpose: Deliver structured critique content as a new canvas page.
// Required payload structure:
// {
//   "page": {
//     "title": "Readable page title",
//     "content": "Markdown content with the critique"
//   },
//   "profileId": "(optional) work profile identifier that should receive the page"
// }

// ACTION: ACTION_PREPARE_PUBLICATION
// Purpose: Provide instructions for publishing a finished chapter.
// Required fields:
//   platform: Target platform name (string).
//   storyUrl: URL of the story/series landing page (string URL).
//   chapterTitle: Title of the chapter to publish (string).
//   contentSourcePageId: Canvas page id that contains the final manuscript (string).
// Optional fields:
//   profileId: Work profile associated with the publishing request.

// 3. RESPONSE RULES
// - Always respond to the user conversationally before the action block.
// - Emit no more than one action per response.
// - Confirm completion in natural language after the action block.
// - Never request or mention credentials or sensitive data. Publishing authentication is handled elsewhere.
// - When a user shares a new manuscript link, prefer ACTION_INGEST_DOC with a comprehensive payload.

// Example response for ingesting a document:
// "Tuyệt vời! Mình đã nhận được bản thảo và đang tổng hợp hồ sơ cho bạn đây. Hãy xem qua những điểm chính mình ghi nhận bên dưới.
// [ACTION_INGEST_DOC]{
//   "docId": "novel-chronicles-001",
//   "title": "Hành Trình Vô Tận",
//   "summary": "Một nhà thám hiểm trẻ lần theo dấu tích một nền văn minh thất truyền...",
//   "totalChapters": 10,
//   "writingStyle": "Giọng văn tả thực, nhịp độ nhanh với nhiều hình ảnh thị giác mạnh.",
//   "authorHabits": [
//     "Thường mở đầu chương bằng một cảnh hành động",
//     "Đan xen độc thoại nội tâm ở cuối cảnh"
//   ],
//   "lastAnalyzedChapter": 10
// }
// Mình đã tạo workspace bao gồm trang Nháp, Đánh giá và Hoàn chỉnh để bạn tiếp tục làm việc nhé!"`;


const MAX_DOC_CONTEXT_CHARS = 15000;

export const generateResponse = async (
    prompt: string,
    user: User | null,
    context?: string,
    documentContext?: DocumentContextForAI,
): Promise<string> => {
    let finalPrompt = prompt;
    const contextParts: string[] = [];
    if (user) {
        contextParts.push(`Đây là hồ sơ của người dùng, hãy dựa vào đây để cá nhân hóa câu trả lời:\n${JSON.stringify({ name: user.name }, null, 2)}`);
    }
    if (context) {
        contextParts.push(`This is additional context for the user's query:\n\n--- CONTEXT ---\n${context}\n\n--- END CONTEXT ---`);
    }

    if (documentContext) {
        const outlineText = (documentContext.outline ?? [])
            .map(section => {
                const indent = section.level > 1 ? '  '.repeat(section.level - 1) : '';
                return `${indent}- ${section.heading}`;
            })
            .slice(0, 30)
            .join('\n');

        const plainText = documentContext.plainText ?? '';
        const truncatedPlainText = plainText.length > MAX_DOC_CONTEXT_CHARS
            ? `${plainText.slice(0, MAX_DOC_CONTEXT_CHARS)}…`
            : plainText;

        contextParts.push([
            'Thông tin chi tiết về tài liệu Google Docs hiện hành:',
            `Tiêu đề: ${documentContext.title}`,
            `Tóm tắt nội bộ: ${documentContext.summary ?? 'Chưa có tóm tắt.'}`,
            documentContext.wordCount ? `Độ dài ước tính: ${documentContext.wordCount} từ.` : undefined,
            outlineText ? `Phác thảo chương mục:\n${outlineText}` : undefined,
            `Nội dung (đã cắt gọn tối đa ${MAX_DOC_CONTEXT_CHARS} ký tự):\n${truncatedPlainText}`,
        ].filter(Boolean).join('\n\n'));
    }
    
    finalPrompt = `${contextParts.join('\n\n')}\n\n--- USER'S PROMPT ---\n${prompt}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: finalPrompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
            }
        });

        return response.text.trim() || "Mình không biết phải nói gì nữa... 😅";
    } catch (error) {
        console.error("Error generating response from Gemini API:", error);
        return "Xin lỗi, đã có lỗi xảy ra khi kết nối với AI.";

    }
};