import React, { useState, useEffect, useRef, useCallback  } from 'react';
import type { User, Message, CanvasPage, WorkProfile, GoogleDocIngestResponse, DocumentContextForAI, WorkspaceSnapshot  } from './types';
import { generateResponse } from './services/geminiService';
import { ActionTag, parseModelActions, type ActionPayloads } from './services/actionSchema';
import { createCritiquePageFromAction, createWorkProfileFromIngestAction, ensureProfileAssociation } from './services/actionEffects';
import { FileIcon, SendIcon, BotIcon, TrashIcon } from './components/icons';
import DocumentCanvas, { type DocumentCanvasHandle } from './components/DocumentCanvas';
import PublishModal from './components/PublishModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import UploadDocForm from './components/UploadDocForm';
import GoogleSignInButton from './components/GoogleSignInButton';
import ThemeToggle from './components/ThemeToggle';
import ChatButton from './components/ChatButton';
import { loginWithGoogle, fetchSession, logout } from './services/authService';
import { saveWorkspace } from './services/workspaceService';

const LOCAL_STORAGE_KEYS = {
    MESSAGES: 'couple_ai_writer_messages',
    PAGES: 'couple_ai_writer_pages',
    CHAT_PAGE: 'couple_ai_writer_chat_page',
    WORK_PROFILES: 'couple_ai_writer_work_profiles',
    LAST_SELECTED_PROFILE: 'couple_ai_writer_last_profile',
    SESSION_TOKEN: 'couple_ai_writer_session_token',
    USER: 'couple_ai_writer_user',
};

const INITIAL_CHAT_PAGE: CanvasPage = {
    id: 'chat-page',
    title: 'Chat',
    content: '',
    position: { x: 950, y: 80 },
    size: { width: 450, height: 600 },
};

const normalizeWorkProfile = (profile: WorkProfile): WorkProfile => {
    const docId = profile.docId ?? profile.id;
    const outline = profile.outline ?? profile.document?.outline ?? [];
    const rawText = profile.rawText ?? profile.document?.plainText ?? '';
    const document = profile.document ?? (rawText
        ? {
            docId,
            title: profile.title,
            revisionId: profile.document?.revisionId,
            plainText: rawText,
            wordCount: rawText ? rawText.trim().split(/\s+/).length : 0,
            outline,
            lastUpdated: profile.lastSyncedAt,
        }
        : undefined);

    return {
        ...profile,
        docId,
        outline,
        rawText,
        lastSyncedAt: profile.lastSyncedAt ?? document?.lastUpdated ?? new Date().toISOString(),
        document,
        pageIds: profile.pageIds ?? [],
    };
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [workProfiles, setWorkProfiles] = useState<WorkProfile[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');
    const [pages, setPages] = useState<CanvasPage[]>([]);
    const [sessionToken, setSessionToken] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [chatPage, setChatPage] = useState<CanvasPage>({...INITIAL_CHAT_PAGE });
     const [isHydrated, setIsHydrated] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // State for the publishing modal
    const [isPublishingModalOpen, setIsPublishingModalOpen] = useState(false);
    type PublishModalParams = {
    platform: string;
    storyUrl: string;
    chapterTitle: string;
    contentSourcePageId: string;
    profileId?: string; 
};

const [publishingParams, setPublishingParams] = useState<PublishModalParams | null>(null);

    // State for the delete confirmation modal
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'profile' | 'page'; name: string; } | null>(null);

    const canvasRef = useRef<DocumentCanvasHandle>(null);
 const workspaceSyncTimeout = useRef<number | undefined>(undefined);

    const applyWorkspaceSnapshot = useCallback((snapshot: WorkspaceSnapshot) => {
        setMessages(snapshot?.messages ?? []);
        setPages(snapshot?.pages ?? []);
        setChatPage(snapshot?.chatPage ? { ...snapshot.chatPage } : { ...INITIAL_CHAT_PAGE });
        const normalizedProfiles = (snapshot?.workProfiles ?? []).map(profile => normalizeWorkProfile(profile));
        setWorkProfiles(normalizedProfiles);
        setSelectedProfileId(snapshot?.selectedProfileId ?? null);
    }, []);

    const handleDocumentImported = (payload: GoogleDocIngestResponse) => {
        const { document, workProfile } = payload;
        const targetDocId = workProfile.docId ?? document.docId;
        const sameDocProfile = workProfiles.find(profile =>
            profile.docId === targetDocId || profile.googleDocUrl === workProfile.googleDocUrl);
        const existingIds = new Set(workProfiles.map(profile => profile.id));
        const baseId = sameDocProfile?.id || workProfile.id || document.docId || `work-${Date.now()}`;
        let profileId = baseId;
        while (!sameDocProfile && existingIds.has(profileId)) {
            profileId = `${baseId}-${Math.floor(Math.random() * 1000)}`;
        }

        const hydratedProfile = normalizeWorkProfile({
            ...workProfile,
            id: profileId,
            docId: workProfile.docId ?? document.docId,
            outline: workProfile.outline ?? document.outline,
            rawText: workProfile.rawText ?? document.plainText,
            document,
            lastSyncedAt: workProfile.lastSyncedAt ?? document.lastUpdated ?? new Date().toISOString(),
            pageIds: workProfile.pageIds ?? [],
        });

        const timestamp = Date.now();
        const draftPage: CanvasPage = {
            id: `page-${timestamp}-draft`,
            title: `Bản Nháp - ${hydratedProfile.title}`,
            content: '# Bắt đầu viết bản nháp của bạn ở đây...\n\n',
            position: { x: 100, y: 100 },
            size: { width: 400, height: 300 },
        };
        const critiquePage: CanvasPage = {
            id: `page-${timestamp + 1}-critique`,
            title: `Đánh giá - ${hydratedProfile.title}`,
            content: '# Nơi nhận các phân tích và góp ý từ AI.',
            position: { x: 550, y: 100 },
            size: { width: 400, height: 300 },
        };
        const finalPage: CanvasPage = {
            id: `page-${timestamp + 2}-final`,
            title: `Hoàn chỉnh - ${hydratedProfile.title}`,
            content: '# Nơi chứa chương truyện đã được chau chuốt.',
            position: { x: 1000, y: 100 },
            size: { width: 400, height: 300 },
        };

        const profileWithPages: WorkProfile = {
            ...hydratedProfile,
            pageIds: [draftPage.id, critiquePage.id, finalPage.id],
        };

        const previousPageIds = sameDocProfile?.pageIds ?? [];
        setPages(prev => [
            ...prev.filter(page => !previousPageIds.includes(page.id)),
            draftPage,
            critiquePage,
            finalPage,
        ]);
        setWorkProfiles(prev => [...prev.filter(profile => profile.id !== profileWithPages.id), profileWithPages]);
        setSelectedProfileId(profileWithPages.id);

        const introMessage = `Mình đã tải tài liệu "${document.title}" (${document.wordCount} từ).\n\nTóm tắt nhanh:\n${profileWithPages.summary}`;
        setMessages(prev => [
            ...prev,
            {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                text: introMessage,
            },
        ]);

        setTimeout(() => {
            canvasRef.current?.focusOn(draftPage.id, 'page');
        }, 200);
    };

    // Load initial state from localStorage
    useEffect(() => {
        try {
              const storedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser?.id && parsedUser?.name) {
                        setUser(parsedUser);
                    }
                } catch (error) {
                    console.error('Failed to parse stored user', error);
                }
            }
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
                    text: "Chào mừng bạn đến với Studio Viết lách Dei8 AI! Để bắt đầu, hãy dán đường dẫn Google Docs vào biểu mẫu 'Phân tích Google Docs' bên trái. Mình sẽ tải nội dung, phân tích và tạo không gian làm việc cho bạn."
               };
                setMessages([initialWelcomeMessage]);
            }
            if (storedPages) setPages(JSON.parse(storedPages));
            if (storedChatPage) setChatPage(JSON.parse(storedChatPage));

            let profiles: WorkProfile[] = [];
            if (storedProfiles) {
               const parsedProfiles = JSON.parse(storedProfiles);
                if (Array.isArray(parsedProfiles)) {
                    profiles = parsedProfiles.map((profile: WorkProfile) => normalizeWorkProfile(profile));
                    setWorkProfiles(profiles);
                }
            }
            
            // Restore last selected session
            if (storedLastProfileId && profiles.some(p => p.id === storedLastProfileId)) {
                setSelectedProfileId(storedLastProfileId);
            }

       } catch (error) { console.error("Failed to load state from localStorage", error); }
        finally {
            setIsHydrated(true);
        }
    }, []);

     useEffect(() => {
        const storedToken = localStorage.getItem(LOCAL_STORAGE_KEYS.SESSION_TOKEN);
        if (!storedToken) {
            return;
        }

        setIsAuthenticating(true);
        setSessionToken(storedToken);
        setAuthError(null);

        fetchSession(storedToken)
            .then(({ user: sessionUser, workspace }) => {
                setUser(sessionUser);
                if (workspace) {
                    applyWorkspaceSnapshot(workspace);
                }
            })
            .catch(error => {
                console.error('Failed to restore session', error);
                setAuthError(error instanceof Error ? error.message : 'Không thể khôi phục phiên đăng nhập.');
                setSessionToken(null);
                setUser(null);
                localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION_TOKEN);
                localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
            })
            .finally(() => {
                setIsAuthenticating(false);
            });
    }, [applyWorkspaceSnapshot]);

    useEffect(() => {
        if (sessionToken) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.SESSION_TOKEN, sessionToken);
        } else {
            localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION_TOKEN);
        }
    }, [sessionToken]);

    useEffect(() => {
        if (user) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
        } else {
            localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
        }
    }, [user]);

    // Save state to localStorage on change
    useEffect(() => {
        if (!isHydrated) {
            return;
        }
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

     useEffect(() => {
        if (!sessionToken) {
            return;
        }

        const snapshot: WorkspaceSnapshot = {
            messages,
            pages,
            chatPage,
            workProfiles,
            selectedProfileId,
        };

        const timeoutId = window.setTimeout(() => {
            saveWorkspace(sessionToken, snapshot)
                .then(() => {
                    setAuthError(prev => (prev && prev.startsWith('Không thể đồng bộ workspace') ? null : prev));
                })
                .catch(error => {
                    console.error('Failed to sync workspace to server', error);
                    setAuthError('Không thể đồng bộ workspace lên máy chủ.');
                });
        }, 600);

        workspaceSyncTimeout.current = timeoutId;

        return () => {
            window.clearTimeout(timeoutId);
            if (workspaceSyncTimeout.current === timeoutId) {
                workspaceSyncTimeout.current = undefined;
            }
        };
    }, [messages, pages, chatPage, workProfiles, selectedProfileId, sessionToken]);

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

     const handleGoogleCredential = useCallback(async (credential: string) => {
        setIsAuthenticating(true);
        setAuthError(null);
        try {
            const result = await loginWithGoogle(credential);
            setUser(result.user);
            setSessionToken(result.sessionToken);
            if (result.workspace) {
                applyWorkspaceSnapshot(result.workspace);
            }
        } catch (error) {
            console.error('Google login failed', error);
            setAuthError(error instanceof Error ? error.message : 'Đăng nhập Google thất bại.');
        } finally {
            setIsAuthenticating(false);
        }
    }, [applyWorkspaceSnapshot]);

    const handleGoogleError = useCallback((message: string) => {
        console.error(message);
        setAuthError(message);
    }, []);

    const handleLogout = useCallback(async () => {
        if (!sessionToken) {
            setUser(null);
            setAuthError(null);
            return;
        }

        setIsAuthenticating(true);
        try {
            await logout(sessionToken);
        } catch (error) {
            console.error('Failed to logout', error);
        } finally {
            if (workspaceSyncTimeout.current !== undefined) {
                window.clearTimeout(workspaceSyncTimeout.current);
                workspaceSyncTimeout.current = undefined;
            }
            setSessionToken(null);
            setUser(null);
            setAuthError(null);
            setIsAuthenticating(false);
        }
    }, [sessionToken]);


    const handleNavigateTo = (id: string, type: 'page' | 'chat') => canvasRef.current?.focusOn(id, type);
    
    const handleSendMessage = async (messageText: string) => {
        const trimmedInput = messageText.trim();
        if (!trimmedInput || isLoading) return;

        const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', text: trimmedInput };
        setMessages(prev => [...prev, userMessage]);
        
        setInput('');
        setIsLoading(true);

       const activeProfile = workProfiles.find(p => p.id === selectedProfileId);
        const context = activeProfile?.summary;
        const documentContext: DocumentContextForAI | undefined = activeProfile && (activeProfile.rawText || activeProfile.document)
            ? {
                title: activeProfile.title,
                summary: activeProfile.summary,
                plainText: activeProfile.rawText ?? activeProfile.document?.plainText ?? '',
                outline: activeProfile.outline ?? activeProfile.document?.outline,
                wordCount: activeProfile.document?.wordCount ?? undefined,
            }
            : undefined;

        try {
            const rawResponse = await generateResponse(trimmedInput, user, context, documentContext);
            
 const { userFacingText, actions } = parseModelActions(rawResponse);
            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                text: userFacingText || 'Mình đã xử lý yêu cầu của bạn!'
            };
            setMessages(prev => [...prev, assistantMessage]);

            let updatedPages = pages;
            let updatedWorkProfiles = workProfiles;
            let updatedSelectedProfileId = selectedProfileId;
            let pagesChanged = false;
            let profilesChanged = false;
            let selectedChanged = false;
            let publishParamsLocal: PublishModalParams | null = null;
            let shouldOpenPublishModal = false;
            let focusPageId: string | null = null;

            actions.forEach(action => {
                switch (action.type) {
                    case ActionTag.INGEST_DOC: {
                        const ingestDocPayload = action.payload as ActionPayloads[ActionTag.INGEST_DOC];
                        const { profile, pages: generatedPages } = createWorkProfileFromIngestAction(ingestDocPayload, trimmedInput);
                        updatedPages = [...updatedPages, ...generatedPages];
                        updatedWorkProfiles = [...updatedWorkProfiles, profile];
                        updatedSelectedProfileId = profile.id;
                        pagesChanged = true;
                        profilesChanged = true;
                        selectedChanged = true;
                        break;
                    }
                    case ActionTag.CREATE_CRITIQUE_PAGE: {
                        if (updatedWorkProfiles.length === 0) {
                            console.warn('Received critique action but no work profiles are available.');
                            break;
                        }
                        const profileIds = updatedWorkProfiles.map(p => p.id);
                        const critiquePagePayload = action.payload as ActionPayloads[ActionTag.CREATE_CRITIQUE_PAGE];
const targetProfileId = ensureProfileAssociation(profileIds, updatedSelectedProfileId, critiquePagePayload.profileId);
                        if (!targetProfileId) {
                            console.warn('Unable to determine a target profile for critique page.');
                            break;
                        }
                        const targetProfile = updatedWorkProfiles.find(p => p.id === targetProfileId);
                        const existingCount = targetProfile ? targetProfile.pageIds.length : 0;
                        const newPage = createCritiquePageFromAction(critiquePagePayload, existingCount);
                        updatedPages = [...updatedPages, newPage];
                        updatedWorkProfiles = updatedWorkProfiles.map(profile =>
                            profile.id === targetProfileId
                                ? { ...profile, pageIds: [...profile.pageIds, newPage.id] }
                                : profile
                        );
                        focusPageId = newPage.id;
                        if (updatedSelectedProfileId !== targetProfileId) {
                            updatedSelectedProfileId = targetProfileId;
                            selectedChanged = true;
                        }
                        pagesChanged = true;
                        profilesChanged = true;
                        break;
                    }
                   case ActionTag.PREPARE_PUBLICATION: {
                        publishParamsLocal = action.payload as PublishModalParams;
                        shouldOpenPublishModal = true;
                        break;
                    }
                    default: {
                        console.warn('Unhandled action received from model:', action.type);
                    }
                }
            });

            if (pagesChanged) {
                setPages(updatedPages);
            }
            if (profilesChanged) {
                setWorkProfiles(updatedWorkProfiles);
            }
            if (selectedChanged) {
                setSelectedProfileId(updatedSelectedProfileId);
            }
           if (shouldOpenPublishModal && publishParamsLocal) { 
                setPublishingParams(publishParamsLocal);
                setIsPublishingModalOpen(true);
            }
            if (focusPageId) {
                const targetPageId = focusPageId;
                setTimeout(() => {
                    if (targetPageId) {
                        canvasRef.current?.focusOn(targetPageId, 'page');
                    }
                }, 100);
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
        <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
            <aside className="w-80 flex-shrink-0 bg-[var(--color-surface-strong)] backdrop-blur-sm flex flex-col p-4 border-r border-[var(--color-border)] shadow-[var(--shadow-md)] z-10">
                <div className="flex items-center mb-6">
                    <BotIcon className="w-8 h-8 text-[var(--color-primary)] mr-2" />
                    <h1 className="text-xl font-semibold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-serif)' }}>Dei8 AI Studio</h1>
                </div>
                 <UploadDocForm onSuccess={handleDocumentImported} />
                <div className="flex-grow overflow-y-auto scrollbar-thin flex flex-col">
                    <div>
                        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] my-2 uppercase tracking-wide">Dự án Truyện</h2>
                        {workProfiles.length > 0 ? (
                            <ul>{workProfiles.map(profile => (
                                <li key={profile.id} className="group">
                                    <button
                                        onClick={() => setSelectedProfileId(profile.id)}
                                        className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all duration-200 ${selectedProfileId === profile.id
                                            ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-[var(--shadow-lg)]'
                                            : 'hover:bg-[var(--color-surface-hover)] hover:shadow-[var(--shadow-sm)]'}`}
                                    >
                                        <div className="flex items-center truncate">
                                            <FileIcon className={`w-5 h-5 mr-3 flex-shrink-0 ${selectedProfileId === profile.id ? 'text-[var(--color-text-on-primary)]' : 'text-[var(--color-primary-dark)]'}`} />
                                            <span className={`truncate text-sm font-medium ${selectedProfileId === profile.id ? 'text-[var(--color-text-on-primary)]' : 'text-[var(--color-text)]'}`}>{profile.title}</span>
                                        </div>
                                        <div
                                            onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: profile.id, type: 'profile', name: profile.title }); }}
                                            className={`p-1 rounded-full transition-all duration-200 ${selectedProfileId === profile.id ? 'hover:bg-white/20' : 'hover:bg-[var(--color-surface-hover)] opacity-0 group-hover:opacity-100'}`}
                                        >
                                            <TrashIcon className={`w-4 h-4 ${selectedProfileId === profile.id ? 'text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-error)]'}`} />
                                        </div>
                                    </button>
                                </li>
                            ))}</ul>
                        ) : <p className="text-[var(--color-text-muted)] text-sm p-3">Chưa có dự án nào. Hãy bắt đầu bằng cách dán link Google Doc vào ô chat.</p>}
                    </div>

                    <div className="mt-4 border-t border-[var(--color-divider)] pt-2 flex-grow">
                        <h2 className="text-xs font-semibold text-[var(--color-text-muted)] my-2 uppercase tracking-wide">Workspace Navigation</h2>
                         <button onClick={() => handleNavigateTo(chatPage.id, 'chat')} className="w-full text-left p-3 rounded-xl flex items-center text-[var(--color-primary)] font-semibold transition-all duration-200 hover:bg-[var(--color-surface-hover)] hover:shadow-[var(--shadow-sm)]">
                            <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h3v3.767L13.277 18H20c-1.103 0-2-.897 2-2V4c0-1.103-.897-2-2-2zm0 14h-7.277L9 18.233V16H4V4h16v12z"></path></svg>
                             Đi đến Chat
                        </button>
                        {visiblePages.map(page => (
                            <div key={page.id} className="text-sm group">
                                <button onClick={() => handleNavigateTo(page.id, 'page')} className="w-full text-left p-3 rounded-xl flex items-center justify-between transition-all duration-200 hover:bg-[var(--color-surface-hover)] hover:shadow-[var(--shadow-sm)]">
                                   <span className="truncate font-medium text-[var(--color-text)]">{page.title}</span>
                                   <div
                                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: page.id, type: 'page', name: page.title }); }}
                                        className="p-1 rounded-full hover:bg-[var(--color-surface-hover)] opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <TrashIcon className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-error)]" />
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
            <main className="flex-1 flex flex-col bg-[var(--color-bg)] overflow-hidden min-w-0">
                <header className="flex items-center justify-between p-4 bg-[var(--color-surface-strong)] backdrop-blur-sm border-b border-[var(--color-border)] shadow-[var(--shadow-sm)] z-20 flex-shrink-0">
                    <ThemeToggle />
                    {user ? (
                        <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt="User Avatar"
                                            className="w-10 h-10 rounded-full border border-[rgba(119,134,103,0.35)] object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-[var(--color-text-on-primary)] flex items-center justify-center font-semibold">
                                            {user.name?.charAt(0)?.toUpperCase() ?? 'A'}
                                        </div>
                                    )}
                                    <div className="ml-3 text-right">
                                        <span className="block font-medium text-[var(--color-primary-dark)] leading-tight">{user.name}</span>
                                        {user.email ? <span className="block text-xs text-[var(--color-text-muted)]">{user.email}</span> : null}
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    disabled={isAuthenticating}
                                    className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-on-primary)] font-semibold py-2 px-4 rounded-xl shadow-[var(--shadow-lg)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:shadow-none disabled:scale-100"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                            {authError ? <p className="text-xs text-[var(--color-error)] max-w-xs text-right">{authError}</p> : null}
                        </div>
                    ) : (
                        <div className="flex flex-col items-end space-y-2">
                            <GoogleSignInButton
                                disabled={isAuthenticating}
                                onCredential={handleGoogleCredential}
                                onError={handleGoogleError}
                                className="shadow-[var(--shadow-lg)] rounded-xl overflow-hidden"
                            />
                            {authError ? <p className="text-xs text-[var(--color-error)] max-w-xs text-right">{authError}</p> : null}
                        </div>
                    )}
                </header>
                    <div className="flex-1 flex flex-col relative min-h-0 overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <DocumentCanvas
                            ref={canvasRef}
                            pages={visiblePages}
                            setPages={setPages}
                            messages={messages}
                            chatPage={chatPage}
                            setChatPage={setChatPage}
                            isChatOpen={isChatOpen}
                            onChatClose={() => setIsChatOpen(false)}
                        />
                    </div>
                     <div className="absolute bottom-0 left-0 right-0 p-6 z-30 pointer-events-none">
                        <div className="max-w-4xl mx-auto bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] rounded-2xl p-3 flex items-center shadow-[var(--shadow-xl)] pointer-events-auto transition-all">
                             <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(input); } }} placeholder="Dán link Google Doc hoặc trò chuyện với Trợ lý Biên tập..." className="flex-1 bg-transparent focus:outline-none p-2 resize-none text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]" rows={1} disabled={isLoading} style={{ fontFamily: 'var(--font-sans)' }} />
                            <button onClick={() => handleSendMessage(input)} disabled={isLoading || !input.trim()} className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-on-primary)] p-2 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[var(--shadow-lg)] disabled:shadow-none disabled:scale-100"><SendIcon className="w-6 h-6" /></button>
                        </div>
                    </div>
                </div>
            </main>
            
            {/* Chat Toggle Button - Only show when chat is closed */}
            <ChatButton 
                onClick={() => {
                    setIsChatOpen(true);
                    // Focus on chat when opening
                    setTimeout(() => {
                        canvasRef.current?.focusOn(chatPage.id, 'chat');
                    }, 100);
                }}
                isOpen={isChatOpen}
                unreadCount={0} // TODO: Calculate unread messages
            />
            
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