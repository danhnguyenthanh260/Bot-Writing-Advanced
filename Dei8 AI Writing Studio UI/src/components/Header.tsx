import React, { useState } from 'react';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  user: { name: string; avatar: string } | null;
  onLogin: () => void;
  onLogout: () => void;
}

export function Header({ user, onLogin, onLogout }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 h-16 z-[1000] shadow-subtle"
      style={{ backgroundColor: `rgb(var(--surface-strong))`, borderBottom: `1px solid var(--border)` }}
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <h1
            className="m-0 cursor-pointer"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: `rgb(var(--primary))`,
            }}
          >
            Dei8 AI
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-opacity-50 transition-fast"
                style={{ backgroundColor: showDropdown ? `rgb(var(--surface-hover))` : 'transparent' }}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <span style={{ color: `rgb(var(--text-primary))` }}>{user.name}</span>
                <ChevronDown className="w-4 h-4" style={{ color: `rgb(var(--text-muted))` }} />
              </button>

              {showDropdown && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl shadow-large overflow-hidden"
                  style={{ backgroundColor: `rgb(var(--surface))`, border: `1px solid var(--border)` }}
                >
                  <button
                    className="w-full px-4 py-3 flex items-center gap-3 transition-fast"
                    style={{ color: `rgb(var(--text-primary))` }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--surface-hover))`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    className="w-full px-4 py-3 flex items-center gap-3 transition-fast"
                    style={{ color: `rgb(var(--text-primary))` }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--surface-hover))`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-3 flex items-center gap-3 transition-fast"
                    style={{ color: `rgb(var(--error))` }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--surface-hover))`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="px-6 h-12 rounded-lg transition-fast"
              style={{
                backgroundColor: `rgb(var(--primary))`,
                color: 'white',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--primary-dark))`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `rgb(var(--primary))`}
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
