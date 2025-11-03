import React, { useRef, useEffect } from 'react';
import type { Message } from '../types';
import { BotIcon, UserIcon } from './icons';
import ReactMarkdown from 'react-markdown';

interface ChatWidgetProps {
    messages: Message[];
    onClose?: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ messages, onClose }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

   return (
        <div className="flex flex-col h-full bg-[var(--color-surface)] backdrop-blur-md rounded-2xl overflow-hidden border border-[var(--color-primary)] shadow-[var(--shadow-xl)]">
            <div 
                className="px-4 py-3 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] cursor-move handle flex items-center justify-between"
                style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', letterSpacing: 'var(--tracking-tight)' }}
            >
                <h2 className="font-semibold">Chat</h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-4 p-1 rounded-lg hover:bg-white/20 transition-colors"
                        aria-label="Close Chat"
                        title="Đóng Chat"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-[var(--color-bg-soft)]">
                {messages.map((message) => {
                    const isAssistant = message.role === 'assistant';
                    const bubbleClasses = isAssistant
                        ? 'bg-[var(--color-surface-strong)] text-[var(--color-text)] shadow-[var(--shadow-md)]'
                        : 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-[var(--shadow-lg)]';
                    const proseClasses = isAssistant
                        ? 'prose-headings:text-[var(--color-primary-dark)] prose-a:text-[var(--color-primary)]'
                        : 'prose-invert prose-headings:text-[var(--color-text-on-primary)] prose-p:text-[var(--color-text-on-primary)]';

                    return (
                        <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                            {isAssistant && (
                                <div className="w-11 h-11 rounded-full bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0 shadow-[var(--shadow-md)] border-2 border-[var(--color-border)]">
                                    <BotIcon className="w-5 h-5 text-[var(--color-text-on-primary)]" />
                                </div>
                            )}
                            <div className={`max-w-[80%] p-4 rounded-2xl ${bubbleClasses} transition-all duration-200`} style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', lineHeight: 'var(--leading-relaxed)' }}>
                                 <div className={`prose prose-sm max-w-none ${proseClasses}`}>
                                    <ReactMarkdown>
                                        {message.text}
                                    </ReactMarkdown>
                                 </div>
                            </div>
                             {!isAssistant && (
                                <div className="w-11 h-11 rounded-full bg-[var(--color-primary-dark)] flex items-center justify-center flex-shrink-0 shadow-[var(--shadow-md)] border-2 border-[var(--color-border)]">
                                    <UserIcon className="w-5 h-5 text-[var(--color-text-on-primary)]" />
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default ChatWidget;