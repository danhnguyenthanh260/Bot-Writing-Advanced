import React from 'react';
import type { User } from '../types';
import ThemeToggle from './ThemeToggle';
import GoogleSignInButton from './GoogleSignInButton';
import { BotIcon } from './icons';

interface HeaderProps {
  user: User | null;
  isAuthenticating: boolean;
  authError: string | null;
  onLogout: () => void;
  onGoogleCredential: (credential: string) => void;
  onGoogleError: (message: string) => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  user,
  isAuthenticating,
  authError,
  onLogout,
  onGoogleCredential,
  onGoogleError,
  onToggleSidebar,
  isSidebarOpen = false,
}) => {
  return (
    <header
      className="fixed top-0 left-0 right-0 h-16 backdrop-blur-md bg-[var(--color-surface-strong)] border-b border-[var(--color-border)] shadow-[var(--shadow-sm)] flex items-center justify-between px-4 md:px-6 flex-shrink-0"
      style={{
        zIndex: 'var(--z-fixed)',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      }}
    >
      {/* Left Side - Hamburger & Logo */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Hamburger Menu - Mobile Only */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
            aria-label="Toggle Sidebar"
            title="Toggle Sidebar"
          >
            <svg
              className="w-6 h-6 text-[var(--color-text)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        )}
        <BotIcon className="w-6 h-6 md:w-8 md:h-8 text-[var(--color-primary)]" />
        <h1
          className="text-lg md:text-xl font-semibold text-[var(--color-text)]"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          <span className="hidden md:inline">Dei8 AI Studio</span>
          <span className="md:hidden">Dei8</span>
        </h1>
      </div>

      {/* Right Side - Theme Toggle & Auth */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full border border-[rgba(119,134,103,0.35)] object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-[var(--color-text-on-primary)] flex items-center justify-center font-semibold">
                  {user.name?.charAt(0)?.toUpperCase() ?? 'A'}
                </div>
              )}
              <div className="text-right">
                <span className="block font-medium text-[var(--color-primary-dark)] leading-tight text-sm">
                  {user.name}
                </span>
                {user.email && (
                  <span className="block text-xs text-[var(--color-text-muted)]">
                    {user.email}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onLogout}
              disabled={isAuthenticating}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-on-primary)] font-semibold py-2 px-4 rounded-xl shadow-[var(--shadow-lg)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:shadow-none disabled:scale-100 text-sm"
            >
              Đăng xuất
            </button>
            {authError && (
              <p className="text-xs text-[var(--color-error)] max-w-xs text-right">
                {authError}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2">
            <GoogleSignInButton
              disabled={isAuthenticating}
              onCredential={onGoogleCredential}
              onError={onGoogleError}
              className="shadow-[var(--shadow-lg)] rounded-xl overflow-hidden"
            />
            {authError && (
              <p className="text-xs text-[var(--color-error)] max-w-xs text-right">
                {authError}
              </p>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

