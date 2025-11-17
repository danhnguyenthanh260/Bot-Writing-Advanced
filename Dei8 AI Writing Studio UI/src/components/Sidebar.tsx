import React from 'react';
import { ProjectCard } from './ProjectCard';
import { UploadDocForm } from './UploadDocForm';
import { HelpCircle, Settings as SettingsIcon, Plus } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  wordCount: number;
  chapters: number;
  lastUpdated: string;
}

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onProjectClick: (projectId: string) => void;
  onUpload: (url: string) => Promise<void>;
  onCreateNew: () => void;
}

export function Sidebar({
  projects,
  activeProjectId,
  onProjectClick,
  onUpload,
  onCreateNew,
}: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-16 w-80 shadow-small overflow-hidden"
      style={{
        height: 'calc(100vh - 64px)',
        backgroundColor: `rgb(var(--surface-strong))`,
        borderRight: `1px solid var(--border)`,
        zIndex: 999,
      }}
    >
      <div className="h-full flex flex-col">
        {/* Projects Section */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="m-0 text-sm uppercase tracking-wide"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: `rgb(var(--text-muted))`,
                }}
              >
                Projects
              </h2>
              <button
                onClick={onCreateNew}
                className="p-2 rounded-lg transition-fast"
                style={{ color: `rgb(var(--primary))` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `rgb(var(--surface-hover))`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Create new project"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {projects.length === 0 ? (
              <div
                className="p-6 rounded-xl text-center"
                style={{
                  backgroundColor: `rgb(var(--surface))`,
                  border: `1px solid var(--border)`,
                }}
              >
                <p className="m-0 mb-3" style={{ color: `rgb(var(--text-muted))` }}>
                  No projects yet
                </p>
                <button
                  onClick={onCreateNew}
                  className="px-4 py-2 rounded-lg transition-fast"
                  style={{
                    backgroundColor: `rgb(var(--primary))`,
                    color: 'white',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `rgb(var(--primary-dark))`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `rgb(var(--primary))`;
                  }}
                >
                  Create New Project
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    title={project.title}
                    wordCount={project.wordCount}
                    chapters={project.chapters}
                    lastUpdated={project.lastUpdated}
                    isActive={project.id === activeProjectId}
                    onClick={() => onProjectClick(project.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Upload Section */}
          <div className="mb-6">
            <UploadDocForm onUpload={onUpload} />
          </div>
        </div>

        {/* Actions Section */}
        <div
          className="p-5"
          style={{
            borderTop: `1px solid var(--border)`,
          }}
        >
          <div className="flex flex-col gap-2">
            <button
              className="w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-fast"
              style={{ color: `rgb(var(--text-primary))` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `rgb(var(--surface-hover))`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <SettingsIcon className="w-5 h-5" />
              <span>Settings</span>
            </button>
            <button
              className="w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-fast"
              style={{ color: `rgb(var(--text-primary))` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `rgb(var(--surface-hover))`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <HelpCircle className="w-5 h-5" />
              <span>Help</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
