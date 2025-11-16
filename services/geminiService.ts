import { GoogleGenAI } from "@google/genai";
import type { DocumentContextForAI, User } from '../types';

// Initialize AI only if API key is available
const apiKey = process.env.API_KEY || process.env.VITE_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const isOfflineMode = !apiKey || process.env.OFFLINE_MODE === 'true';

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
    
    // ✅ STEP 1: Lấy context từ database nếu có bookId (via API)
    let agentContext = null;
    if (documentContext?.bookId) {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
            const response = await fetch(
                `${API_BASE_URL}/api/context/${documentContext.bookId}?query=${encodeURIComponent(prompt)}`
            );
            if (response.ok) {
                agentContext = await response.json();
            } else {
                console.warn('Failed to get context from API', response.statusText);
            }
        } catch (error) {
            console.warn('Failed to get context from database', error);
        }
    }
    
    // User context
    if (user) {
        contextParts.push(`Đây là hồ sơ của người dùng, hãy dựa vào đây để cá nhân hóa câu trả lời:\n${JSON.stringify({ name: user.name }, null, 2)}`);
    }
    if (context) {
        contextParts.push(`This is additional context for the user's query:\n\n--- CONTEXT ---\n${context}\n\n--- END CONTEXT ---`);
    }

    // ✅ STEP 2: Sử dụng context từ database (ưu tiên)
    if (agentContext) {
        // Book-level context
        if (agentContext.book_context) {
            contextParts.push(
                `Book Context:\n` +
                `Summary: ${agentContext.book_context.summary || 'N/A'}\n` +
                `Characters: ${JSON.stringify(agentContext.book_context.characters || [])}\n` +
                `Writing Style: ${JSON.stringify(agentContext.book_context.writing_style || {})}`
            );
        }
        
        // Recent chapters
        if (agentContext.recent_chapters && agentContext.recent_chapters.length > 0) {
            const chaptersText = agentContext.recent_chapters
                .map(ch => `Chapter ${ch.chapter_number}: ${ch.title || 'Untitled'}\n${ch.summary || 'No summary'}`)
                .join('\n\n');
            contextParts.push(`Recent Chapters:\n${chaptersText}`);
        }
        
        // ✅ Semantic search results (từ Local Embedding)
        if (agentContext.semantic_results && agentContext.semantic_results.length > 0) {
            const searchText = agentContext.semantic_results
                .map(result => `Chapter ${result.chapter_number}: ${result.title || 'Untitled'}\n${result.summary || 'No summary'}`)
                .join('\n\n');
            contextParts.push(`Relevant Passages (from semantic search):\n${searchText}`);
        }
    }
    
    // ✅ Fallback: Dùng documentContext nếu không có database context
    if (!agentContext && documentContext) {
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
    
    // ✅ STEP 3: Final prompt
    finalPrompt = `${contextParts.join('\n\n')}\n\n--- USER'S PROMPT ---\n${prompt}`;

    // Check if offline mode or no API key
    if (isOfflineMode || !ai) {
        return getOfflineResponse(prompt, documentContext);
    }

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
        // Fallback to offline mode on API error
        return getOfflineResponse(prompt, documentContext);
    }
};

/**
 * Offline fallback response when API is unavailable
 */
function getOfflineResponse(
    prompt: string,
    documentContext?: DocumentContextForAI
): string {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check if it's a search query
    const searchKeywords = ['tìm', 'search', 'tìm kiếm', 'where', 'find', 'tìm ở đâu'];
    const isSearchQuery = searchKeywords.some(keyword => lowerPrompt.includes(keyword));
    
    if (isSearchQuery) {
        return `Tôi có thể giúp bạn tìm kiếm trong tài liệu! 

Hiện tại tôi đang ở chế độ offline, nhưng tính năng **tìm kiếm ngữ nghĩa** vẫn hoạt động hoàn toàn local.

Hãy sử dụng:
- **Semantic Search**: Tìm nội dung theo ý nghĩa (không cần từ khóa chính xác)
- **Vector Search**: Tìm các đoạn văn tương tự trong tài liệu

${documentContext ? `Tôi thấy bạn đang làm việc với "${documentContext.title}". Bạn có thể tìm kiếm trong tài liệu này.` : ''}

Để sử dụng AI chat đầy đủ, vui lòng thêm API key trong Settings.`;
    }
    
    // Check if it's about document analysis
    const analysisKeywords = ['phân tích', 'analyze', 'đánh giá', 'critique', 'review'];
    const isAnalysisQuery = analysisKeywords.some(keyword => lowerPrompt.includes(keyword));
    
    if (isAnalysisQuery && documentContext) {
        return `Tôi hiểu bạn muốn phân tích tài liệu "${documentContext.title}".

Hiện tại tôi đang ở chế độ offline, nhưng bạn vẫn có thể:
- ✅ Tìm kiếm ngữ nghĩa trong tài liệu
- ✅ Xem và chỉnh sửa nội dung
- ✅ Quản lý workspace

Để sử dụng AI phân tích và đánh giá đầy đủ, vui lòng:
1. Thêm API key (Gemini hoặc OpenAI) trong Settings
2. Đảm bảo có kết nối internet
3. Khởi động lại ứng dụng

API key có thể lấy miễn phí tại:
- Google Gemini: https://aistudio.google.com/app/apikey
- OpenAI: https://platform.openai.com/api-keys`;
    }
    
    // Generic offline message
    return `Hiện tại tôi đang ở chế độ offline. Một số tính năng AI cần kết nối internet và API key.

**Tính năng vẫn hoạt động (không cần API):**
- ✅ Tìm kiếm ngữ nghĩa trong tài liệu (semantic search)
- ✅ Lưu trữ và quản lý tài liệu
- ✅ Xem và chỉnh sửa nội dung
- ✅ Vector search (tìm theo ý nghĩa)

**Tính năng cần API:**
- ⚠️ AI chat/conversation
- ⚠️ Text generation
- ⚠️ Content analysis & critique
- ⚠️ AI-powered feedback

**Để sử dụng AI features:**
1. Vào Settings → API Configuration
2. Thêm API key (Gemini hoặc OpenAI)
3. Khởi động lại ứng dụng

API keys miễn phí:
- Google Gemini: https://aistudio.google.com/app/apikey
- OpenAI: https://platform.openai.com/api-keys

Bạn vẫn có thể sử dụng app để quản lý và tìm kiếm tài liệu ngay bây giờ!`;
}