import React from 'react';
import { BotIcon } from './icons';
import { Z_INDEX } from '../constants/zIndex';

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
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-[var(--color-text-on-primary)] shadow-[0_4px_12px_rgba(139,111,71,0.4),0_8px_24px_rgba(139,111,71,0.2)] hover:shadow-[0_8px_16px_rgba(139,111,71,0.5),0_12px_32px_rgba(139,111,71,0.3)] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 active:scale-95 group cursor-pointer animate-pulse-soft"
      style={{ zIndex: Z_INDEX.CHAT_BUTTON }}
      aria-label="Open Chat"
      title="Mở Chat"
    >
      <BotIcon className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--color-error)] text-white text-xs font-semibold flex items-center justify-center animate-bounce">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      {/* Pulse animation for attention */}
      <span className="absolute inset-0 rounded-full bg-[var(--color-primary)] opacity-75 animate-ping group-hover:opacity-0 transition-opacity" />
    </button>
  );
};

export default ChatButton;





