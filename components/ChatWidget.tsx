import React, { useRef, useEffect, useState } from 'react';
import type { Message } from '../types';
import { BotIcon, UserIcon } from './icons';
import ReactMarkdown from 'react-markdown';

interface ChatWidgetProps {
    messages: Message[];
    onClose?: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ messages, onClose }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

   return (
        <div 
            className="flex flex-col h-full bg-[var(--color-surface)] backdrop-blur-xl rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-[0_20px_60px_rgba(0,0,0,0.3)] transition-all duration-300"
            style={{
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                backgroundColor: 'rgba(var(--color-surface-rgb), 0.95)',
            }}
        >
            <div 
                className="px-4 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-[var(--color-text-on-primary)] cursor-move handle flex items-center justify-between shadow-[var(--shadow-md)]"
                style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', letterSpacing: 'var(--tracking-tight)' }}
            >
                <div className="flex items-center gap-2">
                    <BotIcon className="w-5 h-5" />
                    <h2 className="font-semibold">AI Assistant</h2>
                </div>
                <div className="flex items-center gap-2">
                    {onClose && (
                        <>
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-1.5 rounded-lg hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95"
                                aria-label={isMinimized ? "Expand Chat" : "Minimize Chat"}
                                title={isMinimized ? "Mở rộng Chat" : "Thu nhỏ Chat"}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                </svg>
                            </button>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95"
                                aria-label="Close Chat"
                                title="Đóng Chat"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-[var(--color-bg-soft)] transition-all duration-300 ${isMinimized ? 'hidden' : ''}`}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center mb-6 shadow-[var(--shadow-lg)]">
                            <BotIcon className="w-10 h-10 text-[var(--color-text-on-primary)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">
                            Chào mừng đến với AI Assistant!
                        </h3>
                        <p className="text-[var(--color-text-muted)] text-sm max-w-sm mb-4">
                            Hãy bắt đầu trò chuyện hoặc dán link Google Doc để phân tích tài liệu
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center text-xs text-[var(--color-text-subtle)]">
                            <span className="px-3 py-1.5 bg-[var(--color-surface-strong)] rounded-full">
                                💡 Gợi ý
                            </span>
                            <span className="px-3 py-1.5 bg-[var(--color-surface-strong)] rounded-full">
                                📝 Phân tích
                            </span>
                            <span className="px-3 py-1.5 bg-[var(--color-surface-strong)] rounded-full">
                                ✍️ Viết lách
                            </span>
                        </div>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isAssistant = message.role === 'assistant';
                        const bubbleClasses = isAssistant
                            ? 'bg-[var(--color-surface-strong)] text-[var(--color-text)] shadow-[var(--shadow-md)]'
                            : 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-[var(--color-text-on-primary)] shadow-[var(--shadow-lg)]';
                        const proseClasses = isAssistant
                            ? 'prose-headings:text-[var(--color-primary-dark)] prose-a:text-[var(--color-primary)]'
                            : 'prose-invert prose-headings:text-[var(--color-text-on-primary)] prose-p:text-[var(--color-text-on-primary)]';

                        return (
                            <div 
                                key={message.id} 
                                className={`flex items-start gap-3 animate-fade-in-up ${message.role === 'user' ? 'justify-end' : ''}`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {isAssistant && (
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center flex-shrink-0 shadow-[var(--shadow-md)] border-2 border-[var(--color-border)]">
                                        <BotIcon className="w-5 h-5 text-[var(--color-text-on-primary)]" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] p-4 rounded-2xl ${bubbleClasses} transition-all duration-200 hover:shadow-[var(--shadow-lg)]`} style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', lineHeight: 'var(--leading-relaxed)' }}>
                                    <div className={`prose prose-sm max-w-none ${proseClasses}`}>
                                        <ReactMarkdown>
                                            {message.text}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                {!isAssistant && (
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--color-primary-dark)] to-[var(--color-primary)] flex items-center justify-center flex-shrink-0 shadow-[var(--shadow-md)] border-2 border-[var(--color-border)]">
                                        <UserIcon className="w-5 h-5 text-[var(--color-text-on-primary)]" />
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default ChatWidget;