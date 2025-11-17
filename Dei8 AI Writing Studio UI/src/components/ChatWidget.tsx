import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export function ChatWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello! I'm your AI writing assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "I understand you need assistance. I'm here to help with your writing, provide feedback, and answer any questions you have about your document.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-5 right-5 w-14 h-14 rounded-full shadow-large transition-fast flex items-center justify-center z-[998]"
        style={{ backgroundColor: `rgb(var(--primary))` }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.classList.remove('shadow-large');
          e.currentTarget.classList.add('shadow-xlarge');
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.classList.remove('shadow-xlarge');
          e.currentTarget.classList.add('shadow-large');
        }}
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
            style={{ backgroundColor: `rgb(var(--error))` }}
          >
            {unreadCount}
          </div>
        )}
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-5 right-5 w-[400px] rounded-2xl shadow-xlarge overflow-hidden z-[998] transition-slow"
      style={{
        backgroundColor: `rgb(var(--surface))`,
        height: '600px',
        maxHeight: 'calc(100vh - 80px)',
        animation: 'slideUp 300ms ease-out',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Header */}
      <div
        className="p-4 flex items-center justify-between"
        style={{
          backgroundColor: `rgb(var(--surface-strong))`,
          borderBottom: `1px solid var(--border)`,
        }}
      >
        <h3
          className="m-0"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: `rgb(var(--text-primary))`,
          }}
        >
          AI Assistant
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-2 rounded-lg transition-fast"
          style={{ color: `rgb(var(--text-muted))` }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `rgb(var(--surface-hover))`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div
        className="overflow-y-auto p-4"
        style={{
          height: 'calc(100% - 140px)',
          backgroundColor: `rgb(var(--bg-soft))`,
        }}
      >
        <div className="flex flex-col gap-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%] px-4 py-3 rounded-2xl"
                style={{
                  backgroundColor:
                    message.sender === 'user'
                      ? `rgb(var(--primary))`
                      : `rgb(var(--surface-strong))`,
                  color: message.sender === 'user' ? 'white' : `rgb(var(--text-primary))`,
                }}
              >
                <p className="m-0 text-sm leading-relaxed">{message.text}</p>
                <span
                  className="text-xs mt-1 block"
                  style={{
                    opacity: 0.7,
                  }}
                >
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div
                className="px-4 py-3 rounded-2xl flex items-center gap-1"
                style={{
                  backgroundColor: `rgb(var(--surface-strong))`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: `rgb(var(--text-subtle))`,
                    animationDelay: '0ms',
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: `rgb(var(--text-subtle))`,
                    animationDelay: '150ms',
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: `rgb(var(--text-subtle))`,
                    animationDelay: '300ms',
                  }}
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div
        className="p-4"
        style={{
          backgroundColor: `rgb(var(--surface))`,
          borderTop: `1px solid var(--border)`,
        }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 rounded-lg transition-fast"
            style={{
              backgroundColor: `rgb(var(--bg-soft))`,
              border: `1px solid var(--border)`,
              color: `rgb(var(--text-primary))`,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = `rgb(var(--primary))`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = `var(--border)`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="w-12 h-12 rounded-lg flex items-center justify-center transition-fast disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: `rgb(var(--primary))`,
            }}
            onMouseEnter={(e) => {
              if (!isTyping && inputValue.trim()) {
                e.currentTarget.style.backgroundColor = `rgb(var(--primary-dark))`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `rgb(var(--primary))`;
            }}
          >
            {isTyping ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
