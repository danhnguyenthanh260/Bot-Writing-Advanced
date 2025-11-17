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
        className={`fixed left-0 top-16 bottom-0 w-80 flex-shrink-0 bg-[var(--color-surface-strong)] backdrop-blur-sm flex flex-col border-r border-[var(--color-border)] shadow-[var(--shadow-md)] transition-all duration-300 ${
          isCollapsed ? 'w-0 overflow-hidden' : ''
        } ${
          isOpen
            ? 'max-md:translate-x-0'
            : 'max-md:translate-x-[-100%]'
        }`}
        style={{
          zIndex: 'var(--z-fixed)',
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
                {workProfiles.map((profile) => {
                  const isActive = selectedProfileId === profile.id;
                  return (
                  <li key={profile.id} className="group mb-3">
                    <button
                      onClick={() => onSelectProfile(profile.id)}
                      className={`w-full text-left p-4 rounded-xl flex items-center justify-between transition-all duration-200 border ${
                        isActive
                          ? 'bg-[var(--color-primary-subtle)] border-[var(--color-primary)] border-2 shadow-[var(--shadow-md)]'
                          : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:shadow-[var(--shadow-sm)]'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <FileIcon
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            isActive ? 'text-[var(--color-primary-dark)]' : 'text-[var(--color-primary)]'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-base font-semibold mb-1 truncate ${
                            isActive ? 'text-[var(--color-primary-dark)]' : 'text-[var(--color-text)]'
                          }`} style={{ fontFamily: 'var(--font-sans)' }}>
                            {profile.title}
                          </h4>
                        <div className="text-xs text-[var(--color-text-muted)] space-y-0.5">
                          {profile.document?.wordCount && (
                            <p>{profile.document.wordCount.toLocaleString()} words</p>
                          )}
                          {profile.outline && profile.outline.length > 0 && (
                            <p>{profile.outline.length} chapters</p>
                          )}
                          {profile.lastSyncedAt && (
                            <p>Updated {new Date(profile.lastSyncedAt).toLocaleDateString('vi-VN', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                          )}
                        </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProfile(profile.id, profile.title);
                        }}
                        className={`p-2 rounded-lg transition-all duration-200 ml-2 flex-shrink-0 ${
                          isActive
                            ? 'hover:bg-[var(--color-primary-dark)]/20'
                            : 'hover:bg-[var(--color-surface-hover)] opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <TrashIcon
                          className={`w-4 h-4 ${
                            isActive
                              ? 'text-[var(--color-primary-dark)] hover:text-[var(--color-error)]'
                              : 'text-[var(--color-text-muted)] hover:text-[var(--color-error)]'
                          }`}
                        />
                      </button>
                    </button>
                  </li>
                );
                })}
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

