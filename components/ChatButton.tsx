import React from 'react';
import { BotIcon } from './icons';

interface ChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
  isOpen?: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({ onClick, unreadCount = 0, isOpen = false }) => {
  if (isOpen) {
    return null; // Don't show button when chat is open
  }

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-[var(--shadow-xl)] hover:shadow-[var(--shadow-2xl)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group"
      aria-label="Open Chat"
      title="Mở Chat"
    >
      <BotIcon className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--color-error)] text-white text-xs font-semibold flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      {/* Pulse animation for attention */}
      <span className="absolute inset-0 rounded-full bg-[var(--color-primary)] opacity-75 animate-ping group-hover:opacity-0 transition-opacity" />
    </button>
  );
};

export default ChatButton;


