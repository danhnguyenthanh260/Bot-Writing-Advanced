import React, { useState, useEffect, useRef, useCallback  } from 'react';
import type { User, Message, CanvasPage, WorkProfile, GoogleDocIngestResponse, DocumentContextForAI, WorkspaceSnapshot  } from './types';
import { generateResponse } from './services/geminiService';
import { ActionTag, parseModelActions, type ActionPayloads } from './services/actionSchema';
import { createCritiquePageFromAction, createWorkProfileFromIngestAction, ensureProfileAssociation } from './services/actionEffects';
import { SendIcon } from './components/icons';
import DocumentCanvas, { type DocumentCanvasHandle } from './components/DocumentCanvas';
import PublishModal from './components/PublishModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatButton from './components/ChatButton';
import ChatWidget from './components/ChatWidget';
import { loginWithGoogle, fetchSession, logout } from './services/authService';
import { saveWorkspace } from './services/workspaceService';
import { Z_INDEX } from './constants/zIndex';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/Toast';

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const { toasts, removeToast, success, error } = useToast();

    // Keyboard Shortcuts
    useKeyboardShortcuts({
        'cmd+k': (e) => {
            e.preventDefault();
            inputRef.current?.focus();
        },
        'cmd+b': (e) => {
            e.preventDefault();
            setIsSidebarOpen(!isSidebarOpen);
        },
        'escape': (e) => {
            if (isChatOpen) {
                setIsChatOpen(false);
            } else if (isSidebarOpen && window.innerWidth < 768) {
                setIsSidebarOpen(false);
            }
        },
    });

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
            bookId: payload.book_id, // ✅ Lưu bookId từ Flow 1
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

        // ✅ THÊM: Track processing status (optional)
        if (payload.processing && payload.book_id) {
            let pollCount = 0;
            const MAX_POLLS = 60; // Max 2 minutes (60 * 2s)
            
            const checkStatus = async () => {
                try {
                    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
                    const statusResponse = await fetch(
                        `${API_BASE_URL}/api/processing/books/${payload.book_id}/status`
                    );
                    if (statusResponse.ok) {
                        const status = await statusResponse.json();
                        if (status.status === 'completed') {
                            success('Đã xử lý xong và lưu vào database!');
                        } else if (status.status === 'processing' && pollCount < MAX_POLLS) {
                            pollCount++;
                            setTimeout(checkStatus, 2000); // Poll every 2s
                        } else if (pollCount >= MAX_POLLS) {
                            console.warn('Processing status polling timeout');
                        }
                    }
                } catch (error) {
                    console.error('Failed to check processing status', error);
                    // Stop polling on error
                }
            };
            // Start polling after 2 seconds
            setTimeout(checkStatus, 2000);
        }

        const introMessage = `Mình đã tải tài liệu "${document.title}" (${document.wordCount} từ).\n\nTóm tắt nhanh:\n${profileWithPages.summary}`;
        setMessages(prev => [
            ...prev,
            {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                text: introMessage,
            },
        ]);
        success(`Đã tải thành công: ${document.title}`);

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
        
        // ✅ Lấy bookId từ workProfile (được set từ Flow 1)
        const bookId = activeProfile?.bookId;
        
        const documentContext: DocumentContextForAI | undefined = activeProfile && (activeProfile.rawText || activeProfile.document || bookId)
            ? {
                title: activeProfile.title,
                summary: activeProfile.summary,
                plainText: activeProfile.rawText ?? activeProfile.document?.plainText ?? '',
                outline: activeProfile.outline ?? activeProfile.document?.outline,
                wordCount: activeProfile.document?.wordCount ?? undefined,
                bookId: bookId, // ✅ Pass bookId để Flow 2 lấy context từ database
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
            
            // Auto-open chat if not already open
            if (!isChatOpen) {
                setIsChatOpen(true);
            }

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

        } catch (err) {
            console.error("Error processing AI response:", err);
            const errorMessage: Message = { id: `error-${Date.now()}`, role: 'assistant', text: "Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại." };
            setMessages(prev => [...prev, errorMessage]);
            error(err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
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
            success(`Đã xóa dự án: ${deleteTarget.name}`);
        } else if (deleteTarget.type === 'page') {
             // Remove the page
            setPages(prev => prev.filter(p => p.id !== deleteTarget.id));
            // Remove the pageId from its parent work profile
            setWorkProfiles(prev => prev.map(profile => ({
                ...profile,
                pageIds: profile.pageIds.filter(id => id !== deleteTarget.id)
            })));
            success(`Đã xóa trang: ${deleteTarget.name}`);
        }
        setDeleteTarget(null); // Close the modal
    };

    const visiblePages = selectedProfileId ? pages.filter(p => workProfiles.find(wp => wp.id === selectedProfileId)?.pageIds.includes(p.id)) : [];

    return (
        <div className="app-container bg-[var(--color-bg)] text-[var(--color-text)]">
            {/* Header - Always visible at top */}
            <Header
                user={user}
                isAuthenticating={isAuthenticating}
                authError={authError}
                onLogout={handleLogout}
                onGoogleCredential={handleGoogleCredential}
                onGoogleError={handleGoogleError}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                isSidebarOpen={isSidebarOpen}
            />

            {/* Sidebar - Left side */}
            <Sidebar
                workProfiles={workProfiles}
                selectedProfileId={selectedProfileId}
                onSelectProfile={(id) => {
                    setSelectedProfileId(id);
                    setIsSidebarOpen(false); // Close sidebar on mobile after selection
                }}
                onDeleteProfile={(id, name) => setDeleteTarget({ id, type: 'profile', name })}
                visiblePages={visiblePages}
                chatPage={chatPage}
                onNavigateTo={(id, type) => {
                    handleNavigateTo(id, type);
                    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
                }}
                onDeletePage={(id, name) => setDeleteTarget({ id, type: 'page', name })}
                onDocumentImported={handleDocumentImported}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col bg-[var(--color-bg)] overflow-hidden min-w-0 relative">
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
                
                {/* Input Bar - Bottom center */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-[var(--z-fixed)] pointer-events-none">
                    <div className="max-w-4xl mx-auto bg-[var(--color-surface)] backdrop-blur-md border border-[var(--color-border)] rounded-2xl p-3 flex items-end gap-2 shadow-[var(--shadow-xl)] pointer-events-auto transition-all">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(input);
                                }
                            }}
                            placeholder="Dán link Google Doc hoặc trò chuyện với Trợ lý Biên tập... (Cmd+K để focus)"
                            className="flex-1 bg-transparent focus:outline-none p-2 resize-none text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] min-h-[40px] max-h-[120px]"
                            rows={1}
                            disabled={isLoading}
                            style={{ 
                                fontFamily: 'var(--font-sans)',
                                lineHeight: '1.5',
                            }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                            }}
                        />
                        <button
                            onClick={() => handleSendMessage(input)}
                            disabled={isLoading || !input.trim()}
                            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-on-primary)] p-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[var(--shadow-lg)] disabled:shadow-none disabled:scale-100 flex-shrink-0"
                            title={isLoading ? 'Đang xử lý...' : 'Gửi (Enter)'}
                        >
                            {isLoading ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <SendIcon className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </main>

            {/* Chat Widget - Floating when open */}
            {isChatOpen && (
                <div
                    className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100vw-2rem)] md:w-[400px] h-[600px] max-h-[calc(100vh-120px)] animate-scale-in"
                    style={{ 
                        zIndex: Z_INDEX.CHAT_WIDGET,
                        animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <ChatWidget
                        messages={messages}
                        onClose={() => setIsChatOpen(false)}
                    />
                </div>
            )}

            {/* Chat Toggle Button - Only show when chat is closed */}
            {!isChatOpen && (
                <ChatButton
                    onClick={() => {
                        setIsChatOpen(true);
                        setTimeout(() => {
                            canvasRef.current?.focusOn(chatPage.id, 'chat');
                        }, 100);
                    }}
                    isOpen={isChatOpen}
                    unreadCount={0}
                />
            )}

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

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
};
export default App;
