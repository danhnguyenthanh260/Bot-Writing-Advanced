import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  animation = 'pulse',
  width,
  height,
}) => {
  const baseClass = 'bg-[var(--color-surface-strong)]';
  
  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  }[animation];

  const variantClass = {
    circular: 'rounded-full',
    rectangular: 'rounded',
    text: 'rounded h-4',
  }[variant];

  return (
    <div
      className={`${baseClass} ${animationClass} ${variantClass} ${className}`}
      style={{ width, height }}
    />
  );
};

// Pre-built skeleton components
export const ProjectCardSkeleton: React.FC = () => {
  return (
    <div className="p-3 rounded-xl border border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="50%" />
        </div>
      </div>
    </div>
  );
};

export const MessageSkeleton: React.FC = () => {
  return (
    <div className="flex items-start gap-3">
      <Skeleton variant="circular" width={44} height={44} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="90%" />
      </div>
    </div>
  );
};

export const SidebarSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <Skeleton variant="rectangular" width="100%" height={60} />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};


