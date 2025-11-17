import React from 'react';
import { FileText, Clock, MoreVertical } from 'lucide-react';

interface ProjectCardProps {
  title: string;
  wordCount: number;
  chapters: number;
  lastUpdated: string;
  isActive?: boolean;
  onClick: () => void;
}

export function ProjectCard({
  title,
  wordCount,
  chapters,
  lastUpdated,
  isActive = false,
  onClick,
}: ProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl cursor-pointer transition-fast shadow-small"
      style={{
        backgroundColor: isActive ? `rgba(var(--primary), 0.08)` : `rgb(var(--surface))`,
        border: `1px solid ${isActive ? `rgb(var(--primary))` : 'var(--border)'}`,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = `rgb(var(--surface-hover))`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = `rgb(var(--surface))`;
        }
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" style={{ color: `rgb(var(--primary))` }} />
          <h3
            className="m-0"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: `rgb(var(--text-primary))`,
            }}
          >
            {title}
          </h3>
        </div>
        <button
          className="p-1 rounded hover:bg-opacity-50 transition-fast"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <MoreVertical className="w-4 h-4" style={{ color: `rgb(var(--text-muted))` }} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: `rgb(var(--text-muted))` }}>
            {wordCount.toLocaleString()} words
          </span>
          <span className="text-xs" style={{ color: `rgb(var(--text-subtle))` }}>•</span>
          <span className="text-xs" style={{ color: `rgb(var(--text-muted))` }}>
            {chapters} chapters
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" style={{ color: `rgb(var(--text-subtle))` }} />
          <span className="text-xs" style={{ color: `rgb(var(--text-subtle))` }}>
            {lastUpdated}
          </span>
        </div>
      </div>
    </div>
  );
}
