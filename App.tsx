import React, { useState, useEffect, useRef } from 'react';
import type { User, Document, Message, CanvasBlock, CanvasPage } from './types';
import { generateResponse, generateMindMap } from './services/geminiService';
import { GoogleIcon, UploadIcon, FileIcon, SendIcon, BotIcon } from './components/icons';
import DocumentCanvas, { type DocumentCanvasHandle } from './components/DocumentCanvas';

// A new dedicated component for the mind map view
const MindMapMode: React.FC<{ blocks: CanvasBlock[], onBack: () => void }> = ({ blocks, onBack }) => {
    const [positionedBlocks, setPositionedBlocks] = useState<CanvasBlock[]>([]);

    useEffect(() => {
        const childrenMap: Record<string, CanvasBlock[]> = {};
        blocks.forEach(block => {
            const parentId = block.parentId || 'root';
            if (!childrenMap[parentId]) childrenMap[parentId] = [];
            childrenMap[parentId].push(block);
        });

        const finalBlocks: CanvasBlock[] = [];
        const positioned = new Set<string>();

        const layoutNode = (node: CanvasBlock, x: number, y: number, level = 0) => {
            node.position = { x, y };
            finalBlocks.push(node);
            positioned.add(node.id);

            const children = childrenMap[node.id] || [];
            const radius = 200 + level * 50;
            children.forEach((child, index) => {
                const angle = (2 * Math.PI / children.length) * index - (Math.PI / 2);
                layoutNode(child, x + radius * Math.cos(angle), y + radius * Math.sin(angle), level + 1);
            });
        };

        const roots = blocks.filter(b => !b.parentId || !blocks.some(p => p.id === b.parentId));
        roots.forEach((root, index) => {
            layoutNode(root, 400 + index * 800, 200);
        });
        
        blocks.forEach(b => {
            if(!positioned.has(b.id)) {
                 finalBlocks.push({ ...b, position: { x: Math.random() * 500, y: Math.random() * 500 } });
            }
        });
        
        setPositionedBlocks(finalBlocks);
    }, [blocks]);


    return (
        <div className="w-full h-full relative bg-slate-800">
            <DocumentCanvas blocks={positionedBlocks} setBlocks={() => {}} pages={[]} setPages={() => {}} isReadOnly={true} messages={[]} chatPage={{id: '', position: {x:0, y:0}, size: {width:0, height:0}}} setChatPage={()=>{}}/>
            <button
                onClick={onBack}
                className="absolute top-6 left-6 bg-slate-700 hover:bg-slate-600 transition-colors text-white font-semibold py-2 px-4 rounded-lg z-20"
            >
                &larr; Quay lại Workspace
            </button>
        </div>
    );
};

const LOCAL_STORAGE_KEYS = {
    MESSAGES: 'couple_ai_messages',
    PAGES: 'couple_ai_pages',
    BLOCKS: 'couple_ai_blocks',
    CHAT_PAGE: 'couple_ai_chat_page',
    DOCUMENTS: 'couple_ai_documents',
};


const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');
    const [view, setView] = useState<'workspace' | 'mindmap' | 'quiz'>('workspace');
    
    const [pages, setPages] = useState<CanvasPage[]>([]);
    const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([]);
    const [chatPage, setChatPage] = useState({ id: 'chat-page', position: { x: 950, y: 80 }, size: { width: 450, height: 600 } });
    const [mindMapSource, setMindMapSource] = useState<CanvasBlock[] | null>(null);
    const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<DocumentCanvasHandle>(null);

    // Load state from localStorage on initial mount
    useEffect(() => {
        try {
            const storedMessages = localStorage.getItem(LOCAL_STORAGE_KEYS.MESSAGES);
            const storedPages = localStorage.getItem(LOCAL_STORAGE_KEYS.PAGES);
            const storedBlocks = localStorage.getItem(LOCAL_STORAGE_KEYS.BLOCKS);
            const storedChatPage = localStorage.getItem(LOCAL_STORAGE_KEYS.CHAT_PAGE);
            const storedDocs = localStorage.getItem(LOCAL_STORAGE_KEYS.DOCUMENTS);

            if (storedMessages) setMessages(JSON.parse(storedMessages));
            else {
                const hasWelcomed = sessionStorage.getItem('hasWelcomed');
                 if (!hasWelcomed) {
                    const initialWelcomeMessage: Message = {
                        id: 'init',
                        role: 'assistant',
                        text: "Chào bạn! Mình là Couple AI. Chào mừng đến với không gian làm việc của chúng ta! Bạn có thể bắt đầu bằng cách tải lên một tài liệu, hoặc cứ trò chuyện tự nhiên với mình nhé. 😊"
                    };
                    setMessages([initialWelcomeMessage]);
                    sessionStorage.setItem('hasWelcomed', 'true');
                }
            }
            if (storedPages) setPages(JSON.parse(storedPages));
            if (storedBlocks) setCanvasBlocks(JSON.parse(storedBlocks));
            if (storedChatPage) setChatPage(JSON.parse(storedChatPage));
            if (storedDocs) setDocuments(JSON.parse(storedDocs));

        } catch (error) {
            console.error("Failed to load state from localStorage", error);
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
            localStorage.setItem(LOCAL_STORAGE_KEYS.PAGES, JSON.stringify(pages));
            localStorage.setItem(LOCAL_STORAGE_KEYS.BLOCKS, JSON.stringify(canvasBlocks));
            localStorage.setItem(LOCAL_STORAGE_KEYS.CHAT_PAGE, JSON.stringify(chatPage));
            localStorage.setItem(LOCAL_STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [messages, pages, canvasBlocks, chatPage, documents]);


    const handleLogin = () => {
        setUser({ name: "Danh Nguyễn", avatarUrl: `https://i.pravatar.cc/150?u=danhnguyen` });
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const newDoc: Document = { id: `${Date.now()}-${file.name}`, name: file.name, content: content };
                setDocuments(prev => [...prev, newDoc]);
                setSelectedDocumentId(newDoc.id);
                const suggestionMessage: Message = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    text: `Mình đã nhận được tài liệu "${file.name}" rồi. Bạn muốn mình làm gì với tài liệu này? Ví dụ: "Tóm tắt các ý chính" hoặc "Tạo một mind map về nội dung chính".`
                };
                setMessages(prev => [...prev, suggestionMessage]);
            };
            reader.readAsText(file);
        } else {
            alert("Vui lòng tải lên file văn bản (.txt)");
        }
    };

    const handleNavigateTo = (id: string, type: 'page' | 'block' | 'chat') => {
        canvasRef.current?.focusOn(id, type);
    };
    
    const handleSendMessage = async (messageText: string) => {
        const trimmedInput = messageText.trim();
        if (!trimmedInput || isLoading) return;

        const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', text: trimmedInput };
        setMessages(prev => [...prev, userMessage]);
        
        setInput('');
        setIsLoading(true);

        const context = documents.find(doc => doc.id === selectedDocumentId)?.content;

        try {
            const rawResponse = await generateResponse(trimmedInput, user, context);
            
            const userFacingText = rawResponse.split('[ACTION_')[0].trim();
            const assistantMessage: Message = { id: `assistant-${Date.now()}`, role: 'assistant', text: userFacingText };
            setMessages(prev => [...prev, assistantMessage]);

            // --- ACTION: CREATE PAGE ---
            const createPageActionRegex = /\[ACTION_CREATE_PAGE\]([\s\S]*?)\[END_ACTION_CREATE_PAGE\]/g;
            let createMatch;
            while ((createMatch = createPageActionRegex.exec(rawResponse)) !== null) {
                const actionContent = createMatch[1];
                const titleRegex = /PageTitle: "([^"]+)"/;
                const blocksRegex = /Blocks:\n([\s\S]+)/;
                
                const titleMatch = titleRegex.exec(actionContent);
                const blocksMatch = blocksRegex.exec(actionContent);

                if (titleMatch && blocksMatch) {
                    const pageTitle = titleMatch[1];
                    const blocksContent = blocksMatch[1];

                    const newPage: CanvasPage = {
                        id: `page-${Date.now()}`,
                        title: pageTitle,
                        position: { x: 100 + (pages.length % 3) * 450, y: 100 + Math.floor(pages.length / 3) * 350 },
                        size: { width: 400, height: 300 }
                    };

                    const blockRegex = /- BlockTitle: "([^"]+)"\s+BlockContent: "([^"]+)"/g;
                    let blockMatch;
                    const newBlocks: CanvasBlock[] = [];
                    let blockIndex = 0;
                    while((blockMatch = blockRegex.exec(blocksContent)) !== null) {
                        const blockTitle = blockMatch[1];
                        const blockContent = blockMatch[2];
                        newBlocks.push({
                            id: `block-${Date.now()}-${blockIndex}`,
                            content: `**${blockTitle}**\n\n${blockContent}`,
                            position: { x: 30, y: 60 + blockIndex * 100 },
                            size: { width: newPage.size.width - 60, height: 80 },
                            pageId: newPage.id,
                            parentId: null
                        });
                        blockIndex++;
                    }

                    setPages(prev => [...prev, newPage]);
                    setCanvasBlocks(prev => [...prev, ...newBlocks]);
                    
                    setTimeout(() => {
                        canvasRef.current?.focusOn(newPage.id, 'page');
                    }, 100);
                }
            }

            // --- ACTION: NAVIGATE ---
            const navigateActionRegex = /\[ACTION_NAVIGATE\]([\s\S]*?)\[END_ACTION_NAVIGATE\]/g;
            let navigateMatch;
            while ((navigateMatch = navigateActionRegex.exec(rawResponse)) !== null) {
                 const actionContent = navigateMatch[1];
                 const typeRegex = /TargetType: "([^"]+)"/;
                 const titleRegex = /TargetTitle: "([^"]+)"/;

                 const typeMatch = typeRegex.exec(actionContent);
                 if (typeMatch) {
                     const targetType = typeMatch[1];
                     if (targetType === 'chat') {
                         handleNavigateTo(chatPage.id, 'chat');
                     } else if (targetType === 'page' || targetType === 'block') {
                         const titleMatch = titleRegex.exec(actionContent);
                         if (titleMatch) {
                             const targetTitle = titleMatch[1];
                             if (targetType === 'page') {
                                 const targetPage = pages.find(p => p.title.toLowerCase() === targetTitle.toLowerCase());
                                 if (targetPage) handleNavigateTo(targetPage.id, 'page');
                             } else { // block
                                 // Simple search for now: find first block whose content includes title
                                 const targetBlock = canvasBlocks.find(b => b.content.toLowerCase().includes(targetTitle.toLowerCase()));
                                 if (targetBlock) handleNavigateTo(targetBlock.id, 'block');
                             }
                         }
                     }
                 }
            }

        } catch (error) {
            console.error("Error processing AI response:", error);
            const errorMessage: Message = { id: `error-${Date.now()}`, role: 'assistant', text: "Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateMindMap = async (pageId: string) => {
        const sourceBlocks = canvasBlocks.filter(b => b.pageId === pageId);
        if (sourceBlocks.length === 0) {
            alert("Không có nội dung trong trang này để tạo mind map.");
            return;
        }
        setIsLoading(true);
        try {
            const mindMapData = await generateMindMap(sourceBlocks);
            
            const blockMap = new Map(sourceBlocks.map(b => [b.id, b]));
            const blocksForMindMap = mindMapData.map(mb => {
                const originalBlock = blockMap.get(mb.id);
                return {
                    ...(originalBlock!),
                    parentId: mb.parentId,
                };
            });

            setMindMapSource(blocksForMindMap);
            setView('mindmap');
        } catch (e) {
            alert("Đã có lỗi xảy ra khi tạo mind map.");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePageExpansion = (pageId: string) => {
        setExpandedPages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(pageId)) {
                newSet.delete(pageId);
            } else {
                newSet.add(pageId);
            }
            return newSet;
        });
    };

    const renderMainView = () => {
        switch (view) {
            case 'mindmap':
                return mindMapSource ? <MindMapMode blocks={mindMapSource} onBack={() => setView('workspace')} /> : <p>Loading Mind Map...</p>;
            case 'quiz':
                return <p>Quiz Mode (Not Implemented)</p>; // Placeholder
            case 'workspace':
            default:
                return (
                    <div className="flex-1 flex flex-col relative">
                        <DocumentCanvas
                            ref={canvasRef}
                            pages={pages}
                            setPages={setPages}
                            blocks={canvasBlocks}
                            setBlocks={setCanvasBlocks}
                            messages={messages}
                            chatPage={chatPage}
                            setChatPage={setChatPage}
                            onCreateMindMap={handleCreateMindMap}
                        />
                         <div className="absolute bottom-0 left-0 right-0 p-6 z-30 pointer-events-none">
                            <div className="max-w-4xl mx-auto bg-slate-800/90 backdrop-blur-sm rounded-xl p-2 flex items-center shadow-2xl pointer-events-auto">
                                 <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(input); } }} placeholder="Trò chuyện với Couple AI..." className="flex-1 bg-transparent focus:outline-none p-2 resize-none text-white" rows={1} disabled={isLoading} />
                                <button onClick={() => handleSendMessage(input)} disabled={isLoading || !input.trim()} className="bg-cyan-500 text-white p-2 rounded-lg disabled:bg-slate-600 hover:bg-cyan-600"><SendIcon className="w-6 h-6" /></button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen w-screen bg-slate-900 text-white">
            <aside className="w-80 flex-shrink-0 bg-slate-800 flex flex-col p-4">
                <div className="flex items-center mb-6">
                    <BotIcon className="w-8 h-8 text-cyan-400 mr-2" />
                    <h1 className="text-xl font-bold">Couple AI</h1>
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center mb-4"><UploadIcon className="w-5 h-5 mr-2" /> Tải lên tài liệu</button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt" />
                
                <div className="flex-grow overflow-y-auto scrollbar-thin flex flex-col">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-400 my-2 uppercase">Tài liệu của bạn</h2>
                        {documents.length > 0 ? (
                            <ul>{documents.map(doc => (<li key={doc.id}><button onClick={() => setSelectedDocumentId(doc.id)} className={`w-full text-left p-3 rounded-lg flex items-center ${selectedDocumentId === doc.id ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}><FileIcon className="w-5 h-5 mr-3 text-slate-400" /><span className="truncate text-sm">{doc.name}</span></button></li>))}</ul>
                        ) : <p className="text-slate-500 text-sm p-3">Chưa có tài liệu nào.</p>}
                    </div>

                    <div className="mt-4 border-t border-slate-700 pt-2 flex-grow">
                        <h2 className="text-sm font-semibold text-slate-400 my-2 uppercase">Workspace Navigation</h2>
                         <button onClick={() => handleNavigateTo(chatPage.id, 'chat')} className="w-full text-left p-3 rounded-lg flex items-center hover:bg-slate-700/50 text-cyan-400 font-semibold">
                            <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h3v3.767L13.277 18H20c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zm0 14h-7.277L9 18.233V16H4V4h16v12z"></path></svg>
                             Đi đến Chat
                        </button>
                        {pages.map(page => (
                            <div key={page.id} className="text-sm">
                                <div className="flex items-center justify-between group">
                                    <button onClick={() => handleNavigateTo(page.id, 'page')} className="flex-1 text-left p-3 rounded-lg hover:bg-slate-700/50 truncate pr-0">
                                       {page.title}
                                    </button>
                                     <button onClick={() => togglePageExpansion(page.id)} className="p-2 rounded-md hover:bg-slate-700/50">
                                        <svg className={`w-4 h-4 transition-transform ${expandedPages.has(page.id) ? 'rotate-90' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                     </button>
                                </div>
                                {expandedPages.has(page.id) && (
                                    <ul className="pl-6 border-l border-slate-600 ml-2">
                                        {canvasBlocks.filter(b => b.pageId === page.id).map(block => (
                                            <li key={block.id}>
                                                <button onClick={() => handleNavigateTo(block.id, 'block')} className="w-full text-left p-2 rounded-lg hover:bg-slate-700/50 text-slate-300 truncate text-xs">
                                                   - {block.content.split('\n')[0].replace(/\*\*/g, '')}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
            <main className="flex-1 flex flex-col bg-slate-700">
                <header className="flex items-center justify-end p-4 bg-slate-800/50 border-b border-slate-600">
                    {user ? <div className="flex items-center"><span className="mr-3 font-medium">{user.name}</span><img src={user.avatarUrl} alt="User Avatar" className="w-10 h-10 rounded-full" /></div> : <button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center"><GoogleIcon className="w-5 h-5 mr-2" /> Đăng nhập</button>}
                </header>
                {renderMainView()}
            </main>
        </div>
    );
};

export default App;