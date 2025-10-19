import React, { useState, useEffect, useRef } from 'react';
import type { User, Message, CanvasPage, WorkProfile } from './types';
import { generateResponse } from './services/geminiService';
import { GoogleIcon, FileIcon, SendIcon, BotIcon, TrashIcon } from './components/icons';
import DocumentCanvas, { type DocumentCanvasHandle } from './components/DocumentCanvas';
import PublishModal from './components/PublishModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

const LOCAL_STORAGE_KEYS = {
    MESSAGES: 'couple_ai_writer_messages',
    PAGES: 'couple_ai_writer_pages',
    CHAT_PAGE: 'couple_ai_writer_chat_page',
    WORK_PROFILES: 'couple_ai_writer_work_profiles',
    LAST_SELECTED_PROFILE: 'couple_ai_writer_last_profile',
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [workProfiles, setWorkProfiles] = useState<WorkProfile[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');
    
    const [pages, setPages] = useState<CanvasPage[]>([]);
    const [chatPage, setChatPage] = useState<CanvasPage>({ id: 'chat-page', title: 'Chat', content: '', position: { x: 950, y: 80 }, size: { width: 450, height: 600 } });
    
    // State for the publishing modal
    const [isPublishingModalOpen, setIsPublishingModalOpen] = useState(false);
    const [publishingParams, setPublishingParams] = useState<any>(null);

    // State for the delete confirmation modal
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'profile' | 'page'; name: string; } | null>(null);

    const canvasRef = useRef<DocumentCanvasHandle>(null);

    // Load initial state from localStorage
    useEffect(() => {
        try {
            const storedMessages = localStorage.getItem(LOCAL_STORAGE_KEYS.MESSAGES);
            const storedPages = localStorage.getItem(LOCAL_STORAGE_KEYS.PAGES);
            const storedChatPage = localStorage.getItem(LOCAL_STORAGE_KEYS.CHAT_PAGE);
            const storedProfiles = localStorage.getItem(LOCAL_STORAGE_KEYS.WORK_PROFILES);
            const storedLastProfileId = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_PROFILE);

            if (storedMessages) setMessages(JSON.parse(storedMessages));
            else {
                 const initialWelcomeMessage: Message = {
                    id: 'init',
                    role: 'assistant',
                    text: "Chào mừng bạn đến với Studio Viết lách Couple AI! Để bắt đầu, hãy dán đường dẫn Google Doc của tác phẩm vào đây nhé. Mình sẽ phân tích và tạo không gian làm việc cho bạn."
                };
                setMessages([initialWelcomeMessage]);
            }
            if (storedPages) setPages(JSON.parse(storedPages));
            if (storedChatPage) setChatPage(JSON.parse(storedChatPage));

            let profiles: WorkProfile[] = [];
            if (storedProfiles) {
                profiles = JSON.parse(storedProfiles);
                setWorkProfiles(profiles);
            }
            
            // Restore last selected session
            if (storedLastProfileId && profiles.some(p => p.id === storedLastProfileId)) {
                setSelectedProfileId(storedLastProfileId);
            }

        } catch (error) { console.error("Failed to load state from localStorage", error); }
    }, []);

    // Save state to localStorage on change
    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
            localStorage.setItem(LOCAL_STORAGE_KEYS.PAGES, JSON.stringify(pages));
            localStorage.setItem(LOCAL_STORAGE_KEYS.CHAT_PAGE, JSON.stringify(chatPage));
            localStorage.setItem(LOCAL_STORAGE_KEYS.WORK_PROFILES, JSON.stringify(workProfiles));
            if (selectedProfileId) {
                localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_PROFILE, selectedProfileId);
            } else {
                localStorage.removeItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_PROFILE);
            }
        } catch (error) { console.error("Failed to save state to localStorage", error); }
    }, [messages, pages, chatPage, workProfiles, selectedProfileId]);

    // Auto-focus on Draft page when a profile is selected
    useEffect(() => {
        if (selectedProfileId && canvasRef.current) {
            const profile = workProfiles.find(p => p.id === selectedProfileId);
            if (profile) {
                const draftPage = pages.find(p => profile.pageIds.includes(p.id) && p.title.startsWith('Bản Nháp'));
                if (draftPage) {
                    // Use a timeout to ensure the canvas has rendered the pages before focusing
                    setTimeout(() => {
                        canvasRef.current?.focusOn(draftPage.id, 'page');
                    }, 100);
                }
            }
        }
    }, [selectedProfileId, workProfiles, pages]); // Reruns when selectedProfileId or data changes

    const handleLogin = () => setUser({ name: "Tác giả", avatarUrl: `https://i.pravatar.cc/150?u=author` });

    const handleNavigateTo = (id: string, type: 'page' | 'chat') => canvasRef.current?.focusOn(id, type);
    
    const handleSendMessage = async (messageText: string) => {
        const trimmedInput = messageText.trim();
        if (!trimmedInput || isLoading) return;

        const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', text: trimmedInput };
        setMessages(prev => [...prev, userMessage]);
        
        setInput('');
        setIsLoading(true);

        const context = workProfiles.find(p => p.id === selectedProfileId)?.summary;

        try {
            const rawResponse = await generateResponse(trimmedInput, user, context);
            
            const userFacingText = rawResponse.split('[ACTION_')[0].trim();
            const assistantMessage: Message = { id: `assistant-${Date.now()}`, role: 'assistant', text: userFacingText };
            setMessages(prev => [...prev, assistantMessage]);

            // --- ACTION: ANALYZE DOC URL ---
            const analyzeActionRegex = /\[ACTION_ANALYZE_DOC_URL\]([\s\S]*?)\[END_ACTION_ANALYZE_DOC_URL\]/g;
            const analyzeMatch = analyzeActionRegex.exec(rawResponse);
            if (analyzeMatch) {
                const profileJson = JSON.parse(analyzeMatch[1].trim());
                const profileId = `work-${Date.now()}`;
                const newProfile: WorkProfile = {
                    ...profileJson,
                    id: profileId,
                    googleDocUrl: trimmedInput,
                    pageIds: []
                };

                const draftPage: CanvasPage = { id: `page-${Date.now()}-draft`, title: `Bản Nháp - ${profileJson.title}`, content: `# Bắt đầu viết bản nháp của bạn ở đây...`, position: { x: 100, y: 100 }, size: { width: 400, height: 300 }};
                const critiquePage: CanvasPage = { id: `page-${Date.now()}-critique`, title: `Đánh giá - ${profileJson.title}`, content: `# Nơi nhận các phân tích và góp ý từ AI.`, position: { x: 550, y: 100 }, size: { width: 400, height: 300 }};
                const finalPage: CanvasPage = { id: `page-${Date.now()}-final`, title: `Hoàn chỉnh - ${profileJson.title}`, content: `# Nơi chứa chương truyện đã được chau chuốt.`, position: { x: 1000, y: 100 }, size: { width: 400, height: 300 }};
                
                newProfile.pageIds = [draftPage.id, critiquePage.id, finalPage.id];
                
                setPages(prev => [...prev, draftPage, critiquePage, finalPage]);
                setWorkProfiles(prev => [...prev, newProfile]);
                setSelectedProfileId(profileId);
            }

            // --- ACTION: CRITIQUE DRAFT ---
            const critiqueActionRegex = /\[ACTION_CRITIQUE_DRAFT\]([\s\S]*?)\[END_ACTION_CRITIQUE_DRAFT\]/g;
            const critiqueMatch = critiqueActionRegex.exec(rawResponse);
            if(critiqueMatch){
                const actionContent = critiqueMatch[1];
                const titleMatch = /PageTitle: "([^"]+)"/.exec(actionContent);
                const contentMatch = /PageContent: """([\s\S]*?)"""/.exec(actionContent);

                if (titleMatch && contentMatch && selectedProfileId) {
                    const newPage: CanvasPage = {
                        id: `page-${Date.now()}`,
                        title: titleMatch[1],
                        content: contentMatch[1].trim(),
                        position: { x: 150 + (pages.length % 3) * 450, y: 150 + Math.floor(pages.length / 3) * 450 },
                        size: { width: 400, height: 300 }
                    };
                    setPages(prev => [...prev, newPage]);
                    setWorkProfiles(prev => prev.map(p => p.id === selectedProfileId ? {...p, pageIds: [...p.pageIds, newPage.id]} : p));
                    setTimeout(() => canvasRef.current?.focusOn(newPage.id, 'page'), 100);
                }
            }

             // --- ACTION: PUBLISH CHAPTER ---
            const publishActionRegex = /\[ACTION_PUBLISH_CHAPTER\]([\s\S]*?)\[END_ACTION_PUBLISH_CHAPTER\]/g;
            const publishMatch = publishActionRegex.exec(rawResponse);
            if (publishMatch) {
                const params = JSON.parse(publishMatch[1].trim());
                setPublishingParams(params);
                setIsPublishingModalOpen(true);
            }

        } catch (error) {
            console.error("Error processing AI response:", error);
            const errorMessage: Message = { id: `error-${Date.now()}`, role: 'assistant', text: "Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleConfirmDelete = () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === 'profile') {
            const profileToDelete = workProfiles.find(p => p.id === deleteTarget.id);
            if (!profileToDelete) return;

            // Remove the profile
            setWorkProfiles(prev => prev.filter(p => p.id !== deleteTarget.id));
            // Remove all associated pages
            setPages(prev => prev.filter(p => !profileToDelete.pageIds.includes(p.id)));

            // If the deleted profile was selected, unselect it
            if (selectedProfileId === deleteTarget.id) {
                setSelectedProfileId(null);
            }
        } else if (deleteTarget.type === 'page') {
             // Remove the page
            setPages(prev => prev.filter(p => p.id !== deleteTarget.id));
            // Remove the pageId from its parent work profile
            setWorkProfiles(prev => prev.map(profile => ({
                ...profile,
                pageIds: profile.pageIds.filter(id => id !== deleteTarget.id)
            })));
        }
        setDeleteTarget(null); // Close the modal
    };

    const visiblePages = selectedProfileId ? pages.filter(p => workProfiles.find(wp => wp.id === selectedProfileId)?.pageIds.includes(p.id)) : [];

    return (
        <div className="flex h-screen w-screen bg-slate-900 text-white">
            <aside className="w-80 flex-shrink-0 bg-slate-800 flex flex-col p-4">
                <div className="flex items-center mb-6">
                    <BotIcon className="w-8 h-8 text-cyan-400 mr-2" />
                    <h1 className="text-xl font-bold">Couple AI Studio</h1>
                </div>
                
                <div className="flex-grow overflow-y-auto scrollbar-thin flex flex-col">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-400 my-2 uppercase">Dự án Truyện</h2>
                        {workProfiles.length > 0 ? (
                            <ul>{workProfiles.map(profile => (
                                <li key={profile.id} className="group">
                                    <button onClick={() => setSelectedProfileId(profile.id)} className={`w-full text-left p-3 rounded-lg flex items-center justify-between ${selectedProfileId === profile.id ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}>
                                        <div className="flex items-center truncate">
                                            <FileIcon className="w-5 h-5 mr-3 text-slate-400 flex-shrink-0" />
                                            <span className="truncate text-sm">{profile.title}</span>
                                        </div>
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: profile.id, type: 'profile', name: profile.title }); }}
                                            className="p-1 rounded-full hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <TrashIcon className="w-4 h-4 text-slate-400 hover:text-red-400" />
                                        </div>
                                    </button>
                                </li>
                            ))}</ul>
                        ) : <p className="text-slate-500 text-sm p-3">Chưa có dự án nào. Hãy bắt đầu bằng cách dán link Google Doc vào ô chat.</p>}
                    </div>

                    <div className="mt-4 border-t border-slate-700 pt-2 flex-grow">
                        <h2 className="text-sm font-semibold text-slate-400 my-2 uppercase">Workspace Navigation</h2>
                         <button onClick={() => handleNavigateTo(chatPage.id, 'chat')} className="w-full text-left p-3 rounded-lg flex items-center hover:bg-slate-700/50 text-cyan-400 font-semibold">
                            <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h3v3.767L13.277 18H20c-1.103 0-2-.897 2-2V4c0-1.103-.897-2-2-2zm0 14h-7.277L9 18.233V16H4V4h16v12z"></path></svg>
                             Đi đến Chat
                        </button>
                        {visiblePages.map(page => (
                            <div key={page.id} className="text-sm group">
                                <button onClick={() => handleNavigateTo(page.id, 'page')} className="w-full text-left p-3 rounded-lg hover:bg-slate-700/50 flex items-center justify-between">
                                   <span className="truncate">{page.title}</span>
                                   <div
                                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: page.id, type: 'page', name: page.title }); }}
                                        className="p-1 rounded-full hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <TrashIcon className="w-4 h-4 text-slate-400 hover:text-red-400" />
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
            <main className="flex-1 flex flex-col bg-slate-700">
                <header className="flex items-center justify-end p-4 bg-slate-800/50 border-b border-slate-600">
                    {user ? <div className="flex items-center"><span className="mr-3 font-medium">{user.name}</span><img src={user.avatarUrl} alt="User Avatar" className="w-10 h-10 rounded-full" /></div> : <button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center"><GoogleIcon className="w-5 h-5 mr-2" /> Đăng nhập</button>}
                </header>
                <div className="flex-1 flex flex-col relative">
                    <DocumentCanvas
                        ref={canvasRef}
                        pages={visiblePages}
                        setPages={setPages}
                        messages={messages}
                        chatPage={chatPage}
                        setChatPage={setChatPage}
                    />
                     <div className="absolute bottom-0 left-0 right-0 p-6 z-30 pointer-events-none">
                        <div className="max-w-4xl mx-auto bg-slate-800/90 backdrop-blur-sm rounded-xl p-2 flex items-center shadow-2xl pointer-events-auto">
                             <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(input); } }} placeholder="Dán link Google Doc hoặc trò chuyện với Trợ lý Biên tập..." className="flex-1 bg-transparent focus:outline-none p-2 resize-none text-white" rows={1} disabled={isLoading} />
                            <button onClick={() => handleSendMessage(input)} disabled={isLoading || !input.trim()} className="bg-cyan-500 text-white p-2 rounded-lg disabled:bg-slate-600 hover:bg-cyan-600"><SendIcon className="w-6 h-6" /></button>
                        </div>
                    </div>
                </div>
            </main>
            
            <PublishModal
                isOpen={isPublishingModalOpen}
                onClose={() => setIsPublishingModalOpen(false)}
                params={publishingParams}
                pages={pages}
            />

            <DeleteConfirmationModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                itemName={deleteTarget?.name || ''}
                itemType={deleteTarget?.type === 'profile' ? 'dự án' : 'trang'}
            />
        </div>
    );
};

export default App;