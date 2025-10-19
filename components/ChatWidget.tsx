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
        <div className="flex flex-col h-full bg-slate-800 rounded-lg overflow-hidden">
            <div className="p-4 bg-slate-700/50 cursor-move handle">
                <h2 className="font-bold text-lg">Chat</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.map((message) => (
                    <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                        {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                                <BotIcon className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'assistant'
                                ? 'bg-slate-700'
                                : 'bg-blue-600'
                        }`}>
                             {/* FIX: The `className` prop is not valid on `ReactMarkdown`. Wrapped in a div with prose classes instead. */}
                             <div className="prose prose-sm prose-invert max-w-none">
                                <ReactMarkdown>
                                    {message.text}
                                </ReactMarkdown>
                             </div>
                        </div>
                         {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                                <UserIcon className="w-5 h-5 text-white" />
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default ChatWidget;