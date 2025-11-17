import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-12 h-6 rounded-full transition-fast"
      style={{ backgroundColor: theme === 'light' ? 'var(--border)' : `rgb(var(--surface-strong))` }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div
        className="absolute w-5 h-5 rounded-full transition-fast shadow-small flex items-center justify-center"
        style={{
          backgroundColor: `rgb(var(--primary))`,
          transform: theme === 'light' ? 'translateX(-12px)' : 'translateX(12px)',
        }}
      >
        {theme === 'light' ? (
          <Sun className="w-3 h-3 text-white" />
        ) : (
          <Moon className="w-3 h-3 text-white" />
        )}
      </div>
    </button>
  );
}
