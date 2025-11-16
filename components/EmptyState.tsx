import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  illustration?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  illustration,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      {illustration ? (
        <img 
          src={illustration} 
          alt="" 
          className="w-64 h-64 mb-6 opacity-75" 
        />
      ) : icon ? (
        <div className="w-20 h-20 rounded-full bg-[var(--color-surface-strong)] flex items-center justify-center mb-6">
          <div className="text-[var(--color-text-muted)]">
            {icon}
          </div>
        </div>
      ) : null}
      
      <h3 className="text-xl font-semibold mb-2 text-[var(--color-text)]">
        {title}
      </h3>
      {description && (
        <p className="text-[var(--color-text-muted)] max-w-md mb-6 text-sm">
          {description}
        </p>
      )}
      
      {action && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {action}
        </div>
      )}
    </div>
  );
};











