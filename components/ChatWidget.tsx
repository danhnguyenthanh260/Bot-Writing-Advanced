import React, { useRef, useEffect } from 'react';
import type { Message } from '../types';
import { BotIcon, UserIcon } from './icons';
import ReactMarkdown from 'react-markdown';

interface ChatWidgetProps {
    messages: Message[];
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ messages }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

   return (
        <div className="flex flex-col h-full bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden border border-[rgba(119,134,103,0.25)] shadow-[0_18px_45px_rgba(95,111,83,0.18)]">
            <div className="p-4 bg-[var(--accent)]/90 text-white cursor-move handle flex items-center justify-between">
                <h2 className="font-semibold text-lg tracking-wide">Chat</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-white/60">
                {messages.map((message) => {
                    const isAssistant = message.role === 'assistant';
                    const bubbleClasses = isAssistant
                        ? 'bg-[var(--surface-strong)] text-[var(--text)] shadow-[0_12px_25px_rgba(95,111,83,0.15)]'
                        : 'bg-[var(--accent)] text-white shadow-[0_12px_25px_rgba(95,111,83,0.35)]';
                    const proseClasses = isAssistant
                        ? 'prose-headings:text-[var(--accent-dark)] prose-a:text-[var(--accent)]'
                        : 'prose-invert prose-headings:text-white prose-p:text-white';

                    return (
                        <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                            {isAssistant && (
                                <div className="w-9 h-9 rounded-full bg-[var(--accent)]/85 flex items-center justify-center flex-shrink-0 shadow-[0_6px_14px_rgba(95,111,83,0.35)]">
                                    <BotIcon className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <div className={`max-w-[80%] p-3 rounded-lg ${bubbleClasses} transition-all duration-200`}>
                                 <div className={`prose prose-sm max-w-none ${proseClasses}`}>
                                    <ReactMarkdown>
                                        {message.text}
                                    </ReactMarkdown>
                                 </div>
                            </div>
                             {!isAssistant && (
                                <div className="w-9 h-9 rounded-full bg-[var(--accent-dark)] flex items-center justify-center flex-shrink-0 shadow-[0_6px_14px_rgba(95,111,83,0.35)]">
                                    <UserIcon className="w-5 h-5 text-white" />
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