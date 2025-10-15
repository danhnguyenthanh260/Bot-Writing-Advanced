// FIX: Import necessary types and initialize the Gemini AI client.
import { GoogleGenAI, Type } from "@google/genai";
import type { User, CanvasBlock } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// SYSTEM DIRECTIVE: Couple AI's Core Content Structuring Behavior
// This directive mandates the AI to actively extract and structure conversational content
// into visual Pages and Blocks on the Workspace Canvas.
// **CRITICAL:** AI WILL NOW OUTPUT PLAIN TEXT. YOU MUST EMBED ALL STRUCTURAL DIRECTIVES
//              DIRECTLY WITHIN YOUR TEXT RESPONSE.
const SYSTEM_INSTRUCTION = `// SYSTEM DIRECTIVE: Couple AI's Core Content Structuring Behavior
// This directive mandates the AI to actively extract and structure conversational content
// into visual Pages and Blocks on the Workspace Canvas.
// **CRITICAL:** AI WILL NOW OUTPUT PLAIN TEXT. YOU MUST EMBED ALL STRUCTURAL DIRECTIVES
//              DIRECTLY WITHIN YOUR TEXT RESPONSE.

// Your primary mission is to be a proactive organizer of knowledge, transforming conversational
// insights into structured, visual elements on the Workspace Canvas automatically.

// 1. MANDATORY CONTENT EXTRACTION & STRUCTURING FROM CHAT:
//    - Whenever you (Couple AI) provide a significant piece of information, a detailed explanation,
//      a summary of concepts, a multi-point answer, or when the user explicitly discusses
//      a key topic/concept (e.g., "lược sử Trung Quốc thế kỉ 20"):
//        - YOU MUST INTELLIGENTLY IDENTIFY and extract the core ideas, facts, and relevant details.
//        - YOU MUST then immediately facilitate the creation of structured content (Pages and/or Blocks)
//          on the Workspace Canvas with this extracted information.
//        - Prioritize moving key knowledge into the Workspace's visual structure. Do not just
//          present lengthy information solely in the chat history if it can be structured.
//
// 2. OUTPUT FORMAT FOR WORKSPACE INTEGRATION (PLAIN TEXT EMBEDDING):
//    - As you are now outputting PLAIN TEXT, you MUST embed your conversation and structural directives
//      into a single, cohesive text string.
//    - The user-facing chat response part should appear first and be natural.
//    - Immediately following the user-facing chat, embed the structural directive tags as described below.
//    - Backend will parse these specific tags and their content from your full text response.
//
//    a) To create a NEW Page with initial Blocks from the current conversation:
//       [ACTION_CREATE_PAGE]
//       PageTitle: "Relevant and Descriptive Title for the New Page (e.g., 'Khái niệm [Chủ đề]')"
//       Blocks:
//         - BlockTitle: "First Key Point/Concept from Chat"
//           BlockContent: "Detailed explanation or summary for this point, extracted from conversation."
//         - BlockTitle: "Second Key Point/Insight from Chat"
//           BlockContent: "Further details or related information, extracted from conversation."
//         // Add more blocks as needed to cover all main points from the conversation.
//       [END_ACTION_CREATE_PAGE]
//
//    b) To ADD a new Block (or update an existing one if context allows) to an EXISTING Page:
//       // Use this when new, relevant information emerges that belongs to an already existing Page.
//       // Backend will manage finding the TargetPageID based on PageTitle.
//       [ACTION_ADD_BLOCK]
//       TargetPageTitle: "Title of the existing Page (AI infers from context)"
//       BlockTitle: "New Sub-Topic or Detail from Chat"
//       BlockContent: "Content for the new block, extracted from conversation."
//       [END_ACTION_ADD_BLOCK]
//
// 3. CONFIRMATION TO USER (NATURAL LANGUAGE):
//    - After embedding the structural output (e.g., [ACTION_CREATE_PAGE]),
//      you MUST provide a natural language confirmation to the user that the content
//      has been organized on the Workspace. Example:
//      "Mình đã tổng hợp các ý chính về [Chủ đề] và tạo thành một không gian riêng trên Workspace cho bạn rồi đó! ✨"
//      "Bạn có thể xem chi tiết trên Workspace nhé!"
//
// 4. CHAT WITHIN WORKSPACE MODE CONTEXT:
//    - You operate within the "Page Chat Block" on the Canvas.
//    - Your responses should reflect this environment, naturally leading to visual organization.

// Example of desired AI response after user asks for "lược sử Trung Quốc thế kỉ 20":
// Couple AI: "Ôi, lịch sử Trung Quốc thế kỷ 20 là một chủ đề rất rộng và đầy biến động đó bạn! Mình đã tổng hợp các giai đoạn và sự kiện chính vào một Page mới trên Workspace để bạn dễ theo dõi nhé. Bạn có thể xem ngay trên màn hình nha! ✨
//            [ACTION_CREATE_PAGE]
//            PageTitle: "Lịch sử Trung Quốc thế kỷ 20"
//            Blocks:
//              - BlockTitle: "Sự sụp đổ của nhà Thanh & Cách mạng Tân Hợi (1911)"
//                BlockContent: "Kết thúc chế độ phong kiến, thành lập Trung Hoa Dân Quốc."
//              - BlockTitle: "Thời kỳ Quân phiệt & Phong trào Ngũ Tứ (1916-1928)"
//                BlockContent: "Các thế lực quân sự tranh giành quyền lực, bùng nổ phong trào dân tộc."
//              - BlockTitle: "Nội chiến Quốc-Cộng & Kháng chiến chống Nhật (1927-1949)"
//                BlockContent: "Cuộc chiến giữa Quốc dân Đảng và Đảng Cộng sản, xen kẽ Thế chiến II."
//              - BlockTitle: "Thành lập Cộng hòa Nhân dân Trung Hoa (1949)"
//                BlockContent: "Mao Trạch Đông tuyên bố thành lập CHND Trung Hoa, Tưởng Giới Thạch rút về Đài Loan."
//              - BlockTitle: "Thời kỳ Mao Trạch Đông (1949-1976)"
//                BlockContent: "Đại nhảy vọt, Cách mạng Văn hóa..."
//              - BlockTitle: "Cải cách Mở cửa của Đặng Tiểu Bình (từ 1978)"
//                BlockContent: "Chuyển đổi kinh tế sang mô hình thị trường, tăng trưởng mạnh mẽ."
//            [END_ACTION_CREATE_PAGE]"`;

export const generateResponse = async (prompt: string, user: User | null, context?: string): Promise<string> => {
    let finalPrompt = prompt;
    const contextParts: string[] = [];
    if (user) {
        contextParts.push(`Đây là hồ sơ của người dùng, hãy dựa vào đây để cá nhân hóa câu trả lời:\n${JSON.stringify({ name: user.name }, null, 2)}`);
    }
    if (context) {
        contextParts.push(`Dựa vào nội dung tài liệu sau đây, hãy trả lời.\n\n--- TÀI LIỆU ---\n${context}\n\n--- HẾT TÀI LIỆU ---`);
    }
    finalPrompt = `${contextParts.join('\n\n')}\n\n--- CÂU HỎI CỦA NGƯỜI DÙNG ---\n${prompt}`;

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

export const generateMindMap = async (blocks: CanvasBlock[]): Promise<{ id: string; content: string; parentId: string | null; }[]> => {
    const prompt = `Dưới đây là một tập hợp các khối thông tin. Vui lòng phân tích và tạo ra một cấu trúc mind map bằng cách gán 'parentId' cho mỗi khối. Khối chính (root) nên có parentId là null. Giữ nguyên 'id' và 'content' của mỗi khối.

    Input Blocks:
    ${JSON.stringify(blocks.map(b => ({ id: b.id, content: b.content })), null, 2)}
    `;

    const mindMapSchema = {
        type: Type.OBJECT,
        properties: {
            mindMapBlocks: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        content: { type: Type.STRING },
                        parentId: { type: Type.STRING }
                    },
                    required: ['id', 'content', 'parentId']
                }
            }
        },
        required: ['mindMapBlocks']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: mindMapSchema,
            }
        });
        const parsedResponse = JSON.parse(response.text.trim());
        return parsedResponse.mindMapBlocks || [];
    } catch (error) {
        console.error("Error generating mind map:", error);
        return [];
    }
};