import React, { useState } from 'react';
import type { WorkProfile, CanvasPage } from '../types';
import { FileIcon, TrashIcon } from './icons';
import UploadDocForm from './UploadDocForm';

interface SidebarProps {
  workProfiles: WorkProfile[];
  selectedProfileId: string | null;
  onSelectProfile: (id: string) => void;
  onDeleteProfile: (id: string, name: string) => void;
  visiblePages: CanvasPage[];
  chatPage: CanvasPage;
  onNavigateTo: (id: string, type: 'page' | 'chat') => void;
  onDeletePage: (id: string, name: string) => void;
  onDocumentImported: (payload: any) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  workProfiles,
  selectedProfileId,
  onSelectProfile,
  onDeleteProfile,
  visiblePages,
  chatPage,
  onNavigateTo,
  onDeletePage,
  onDocumentImported,
  isOpen = true,
  onClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-[calc(var(--z-fixed)-1)] md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`w-80 flex-shrink-0 bg-[var(--color-surface-strong)] backdrop-blur-sm flex flex-col border-r border-[var(--color-border)] shadow-[var(--shadow-md)] z-[var(--z-fixed)] transition-all duration-300 ${
          isCollapsed ? 'w-0 overflow-hidden' : ''
        } ${
          isOpen
            ? 'max-md:translate-x-0 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-[var(--z-fixed)]'
            : 'max-md:translate-x-[-100%] max-md:fixed max-md:inset-y-0 max-md:left-0'
        }`}
        style={{
          backdropFilter: 'blur(8px) saturate(180%)',
          WebkitBackdropFilter: 'blur(8px) saturate(180%)',
        }}
      >
      <div className="flex flex-col h-full p-4">
        {/* Mobile Close Button */}
        {onClose && (
          <div className="flex items-center justify-between mb-4 md:hidden">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
              aria-label="Close Sidebar"
            >
              <svg className="w-5 h-5 text-[var(--color-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {/* Upload Form */}
        <div className="mb-6">
          <UploadDocForm onSuccess={onDocumentImported} />
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto scrollbar-thin flex flex-col min-h-0">
          {/* Projects Section */}
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] my-2 uppercase tracking-wide">
              Dự án Truyện
            </h2>
            {workProfiles.length > 0 ? (
              <ul className="space-y-2">
                {workProfiles.map((profile) => (
                  <li key={profile.id} className="group">
                    <button
                      onClick={() => onSelectProfile(profile.id)}
                      className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all duration-200 ${
                        selectedProfileId === profile.id
                          ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-[var(--shadow-lg)]'
                          : 'hover:bg-[var(--color-surface-hover)] hover:shadow-[var(--shadow-sm)]'
                      }`}
                    >
                      <div className="flex items-center truncate min-w-0">
                        <FileIcon
                          className={`w-5 h-5 mr-3 flex-shrink-0 ${
                            selectedProfileId === profile.id
                              ? 'text-[var(--color-text-on-primary)]'
                              : 'text-[var(--color-primary-dark)]'
                          }`}
                        />
                        <span
                          className={`truncate text-sm font-medium ${
                            selectedProfileId === profile.id
                              ? 'text-[var(--color-text-on-primary)]'
                              : 'text-[var(--color-text)]'
                          }`}
                        >
                          {profile.title}
                        </span>
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProfile(profile.id, profile.title);
                        }}
                        className={`p-1 rounded-full transition-all duration-200 ${
                          selectedProfileId === profile.id
                            ? 'hover:bg-white/20'
                            : 'hover:bg-[var(--color-surface-hover)] opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <TrashIcon
                          className={`w-4 h-4 ${
                            selectedProfileId === profile.id
                              ? 'text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)]'
                              : 'text-[var(--color-text-muted)] hover:text-[var(--color-error)]'
                          }`}
                        />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface-strong)] flex items-center justify-center mx-auto mb-4">
                  <FileIcon className="w-8 h-8 text-[var(--color-text-muted)]" />
                </div>
                <p className="text-[var(--color-text-muted)] text-sm font-medium mb-2">
                  Chưa có dự án nào
                </p>
                <p className="text-[var(--color-text-subtle)] text-xs">
                  Hãy bắt đầu bằng cách dán link Google Doc vào ô chat
                </p>
              </div>
            )}
          </div>

          {/* Workspace Navigation */}
          <div className="mt-4 border-t border-[var(--color-divider)] pt-4 flex-grow">
            <h2 className="text-xs font-semibold text-[var(--color-text-muted)] my-2 uppercase tracking-wide">
              Workspace Navigation
            </h2>
            <button
              onClick={() => onNavigateTo(chatPage.id, 'chat')}
              className="w-full text-left p-3 rounded-xl flex items-center text-[var(--color-primary)] font-semibold transition-all duration-200 hover:bg-[var(--color-surface-hover)] hover:shadow-[var(--shadow-sm)] mb-2"
            >
              <svg
                className="w-5 h-5 mr-3"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20 2H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h3v3.767L13.277 18H20c-1.103 0-2-.897-2-2V4c0-1.103-.897-2-2-2zm0 14h-7.277L9 18.233V16H4V4h16v12z"></path>
              </svg>
              Đi đến Chat
            </button>
            <div className="space-y-2">
              {visiblePages.map((page) => (
                <div key={page.id} className="text-sm group">
                  <button
                    onClick={() => onNavigateTo(page.id, 'page')}
                    className="w-full text-left p-3 rounded-xl flex items-center justify-between transition-all duration-200 hover:bg-[var(--color-surface-hover)] hover:shadow-[var(--shadow-sm)]"
                  >
                    <span className="truncate font-medium text-[var(--color-text)]">
                      {page.title}
                    </span>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(page.id, page.title);
                      }}
                      className="p-1 rounded-full hover:bg-[var(--color-surface-hover)] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-error)]" />
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;

