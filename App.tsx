import React, { useState, useEffect, useRef } from 'react';
import type { User, Document, Message } from './types';
import { generateResponse } from './services/geminiService';
import { GoogleIcon, UploadIcon, FileIcon, SendIcon, BotIcon, UserIcon } from './components/icons';
import ReactMarkdown from 'react-markdown';

const initialWelcomeMessage: Message = {
    id: 'init',
    role: 'assistant',
    text: "Chào bạn! Mình là Couple AI, rất vui được làm quen. Ừm... mình có thể gọi bạn là gì để tiện trò chuyện không nhỉ? 😊"
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([initialWelcomeMessage]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleLogin = () => {
        // In a real application, this data would be fetched from a database.
        // For this demo, we create a basic user profile.
        // The relationship (preferred_appellation, interests) is built through conversation.
        setUser({
            name: "Danh Nguyễn",
            avatarUrl: `https://i.pravatar.cc/150?u=danhnguyen`,
            learning_interests: [], // Starts empty and is learned through conversation
            learning_goals: [] // Starts empty and is learned through conversation
        });
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const newDoc: Document = {
                    id: `${Date.now()}-${file.name}`,
                    name: file.name,
                    content: content
                };
                setDocuments(prev => [...prev, newDoc]);
                setSelectedDocumentId(newDoc.id);
            };
            reader.readAsText(file);
        } else {
            alert("Vui lòng tải lên file văn bản (.txt)");
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            text: input.trim()
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const context = documents.find(doc => doc.id === selectedDocumentId)?.content;

        try {
            const responseText = await generateResponse(userMessage.text, user, context);
            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                text: responseText
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                text: "Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex h-screen w-screen bg-slate-900 text-white">
            {/* Sidebar */}
            <aside className="w-80 flex-shrink-0 bg-slate-800 flex flex-col p-4">
                <div className="flex items-center mb-6">
                    <BotIcon className="w-8 h-8 text-cyan-400 mr-2" />
                    <h1 className="text-xl font-bold">Couple AI</h1>
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 transition-colors text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center mb-4"
                >
                    <UploadIcon className="w-5 h-5 mr-2" />
                    Tải lên tài liệu
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt"
                />

                <div className="flex-grow overflow-y-auto scrollbar-thin">
                    <h2 className="text-sm font-semibold text-slate-400 mb-2 uppercase">Tài liệu của bạn</h2>
                    {documents.length > 0 ? (
                        <ul>
                            {documents.map(doc => (
                                <li key={doc.id}>
                                    <button
                                        onClick={() => setSelectedDocumentId(doc.id)}
                                        className={`w-full text-left p-3 rounded-lg flex items-center transition-colors ${selectedDocumentId === doc.id ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}
                                    >
                                        <FileIcon className="w-5 h-5 mr-3 text-slate-400 flex-shrink-0" />
                                        <span className="truncate text-sm">{doc.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-500 text-sm p-3">Chưa có tài liệu nào.</p>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col bg-slate-700">
                {/* Header */}
                <header className="flex items-center justify-end p-4 bg-slate-800/50 border-b border-slate-600">
                    {user ? (
                        <div className="flex items-center">
                            <span className="mr-3 font-medium">{user.name}</span>
                            <img src={user.avatarUrl} alt="User Avatar" className="w-10 h-10 rounded-full" />
                        </div>
                    ) : (
                        <button
                            onClick={handleLogin}
                            className="bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold py-2 px-4 rounded-lg flex items-center"
                        >
                            <GoogleIcon className="w-5 h-5 mr-2" />
                            Đăng nhập với Google
                        </button>
                    )}
                </header>

                {/* Chat Window */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    <div className="max-w-4xl mx-auto">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex items-start gap-4 mb-6 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'assistant' && (
                                     <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                                         <BotIcon className="w-6 h-6 text-white" />
                                     </div>
                                )}
                                <div className={`max-w-xl p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-slate-800 rounded-bl-none'}`}>
                                    {/* Fix: The className prop is not valid on ReactMarkdown. Wrap it in a div and apply classes there. */}
                                    <div className="prose prose-invert prose-p:my-0 prose-headings:my-2 prose-pre:bg-slate-900 prose-pre:p-3 prose-pre:rounded-md">
                                        <ReactMarkdown>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                 {msg.role === 'user' && (
                                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                                        {user ? <img src={user.avatarUrl} alt="User Avatar" className="w-10 h-10 rounded-full" /> : <UserIcon className="w-6 h-6 text-slate-300" />}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                             <div className="flex items-start gap-4 mb-6">
                                <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                                    <BotIcon className="w-6 h-6 text-white" />
                                </div>
                                <div className="max-w-xl p-4 rounded-2xl bg-slate-800 rounded-bl-none flex items-center">
                                    <span className="animate-pulse">Đang suy nghĩ...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Chat Input */}
                <div className="p-6">
                    <div className="max-w-4xl mx-auto bg-slate-800 rounded-xl p-2 flex items-center">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Nhập câu hỏi của bạn..."
                            className="flex-1 bg-transparent focus:outline-none p-2 resize-none"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !input.trim()}
                            className="bg-cyan-500 text-white p-2 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-cyan-600 transition-colors"
                        >
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;