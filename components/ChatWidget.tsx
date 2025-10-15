import React, { useRef, useEffect } from 'react';
import type { Message } from '../types';
import { BotIcon, UserIcon } from './icons';
import ReactMarkdown from 'react-markdown';

interface PageChatBlockProps {
    id: string;
    position: { x: number, y: number };
    size: { width: number, height: number };
    messages: Message[];
    onMouseDown: (e: React.MouseEvent) => void;
    onResizeMouseDown: (e: React.MouseEvent) => void;
    isHighlighted?: boolean;
}

export const PageChatBlock: React.FC<PageChatBlockProps> = ({ id, position, size, messages, onMouseDown, onResizeMouseDown, isHighlighted = false }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div
            id={id}
            onMouseDown={onMouseDown}
            className={`absolute p-4 rounded-xl shadow-2xl bg-slate-900/70 backdrop-blur-sm border border-slate-600 text-white cursor-grab select-none flex flex-col transition-all duration-300 ${isHighlighted ? 'ring-4 ring-offset-4 ring-offset-slate-800 ring-yellow-400' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
            }}
        >
            <div className="font-bold text-lg mb-2 p-2 border-b border-slate-700 flex items-center">
                <BotIcon className="w-6 h-6 mr-2 text-cyan-400" />
                <span>Couple AI Assistant</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin pr-2">
                 {messages.map(msg => (
                    <div key={msg.id} className={`flex items-start gap-3 mb-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0"><BotIcon className="w-5 h-5 text-white" /></div>}
                        <div className={`max-w-xs p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-slate-800 rounded-bl-none'}`}>
                            <div className="prose prose-sm prose-invert prose-p:my-0"><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                        </div>
                        {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0"><UserIcon className="w-5 h-5 text-slate-300" /></div>}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div onMouseDown={onResizeMouseDown} className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-cyan-400 border-2 border-slate-900 rounded-full" style={{transform: 'translate(50%, 50%)'}}/>
        </div>
    );
};