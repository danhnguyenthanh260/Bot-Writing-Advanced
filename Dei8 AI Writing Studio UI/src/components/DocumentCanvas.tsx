import React, { useState } from 'react';
import { FileText, MessageSquare, CheckSquare } from 'lucide-react';

interface Page {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
}

interface DocumentCanvasProps {
  hasDocument: boolean;
  onUploadClick: () => void;
}

export function DocumentCanvas({ hasDocument, onUploadClick }: DocumentCanvasProps) {
  const [pages] = useState<Page[]>([
    {
      id: 'draft',
      title: 'Draft',
      content: 'Your original document content will appear here. Upload a Google Docs document to get started.',
      icon: <FileText className="w-6 h-6" />,
    },
    {
      id: 'critique',
      title: 'AI Critique',
      content: 'AI-powered analysis and feedback on your writing will be displayed here. This includes style suggestions, grammar improvements, and structural recommendations.',
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      id: 'final',
      title: 'Final Version',
      content: 'Your refined, polished document ready for publication. Apply AI suggestions and make final edits here.',
      icon: <CheckSquare className="w-6 h-6" />,
    },
  ]);

  if (!hasDocument) {
    return (
      <div
        className="ml-80 mt-16 h-screen flex items-center justify-center"
        style={{ backgroundColor: `rgb(var(--bg-main))` }}
      >
        <div className="text-center max-w-md">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: `rgba(var(--primary), 0.1)` }}
          >
            <FileText className="w-10 h-10" style={{ color: `rgb(var(--primary))` }} />
          </div>
          <h2
            className="mb-3"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: `rgb(var(--text-primary))`,
            }}
          >
            No Document Selected
          </h2>
          <p className="mb-6" style={{ color: `rgb(var(--text-muted))` }}>
            Upload a Google Docs document to get started with AI-powered writing assistance
          </p>
          <button
            onClick={onUploadClick}
            className="px-8 py-3 rounded-lg transition-fast"
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
            Upload Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="ml-80 mt-16 min-h-screen p-8"
      style={{ backgroundColor: `rgb(var(--bg-main))` }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2
            className="mb-2"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: `rgb(var(--text-primary))`,
            }}
          >
            Document Workspace
          </h2>
          <p style={{ color: `rgb(var(--text-muted))` }}>
            Review your draft, AI critique, and final version
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <div
              key={page.id}
              className="rounded-2xl p-6 shadow-medium transition-fast"
              style={{
                backgroundColor: `rgb(var(--surface))`,
                border: `1px solid var(--border)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.classList.remove('shadow-medium');
                e.currentTarget.classList.add('shadow-large');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.classList.remove('shadow-large');
                e.currentTarget.classList.add('shadow-medium');
              }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `rgba(var(--primary), 0.1)`, color: `rgb(var(--primary))` }}
                >
                  {page.icon}
                </div>
                <h3
                  className="m-0"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: `rgb(var(--text-primary))`,
                  }}
                >
                  {page.title}
                </h3>
              </div>
              <div
                className="min-h-[400px] p-4 rounded-xl"
                style={{
                  backgroundColor: `rgb(var(--bg-soft))`,
                  color: `rgb(var(--text-muted))`,
                  lineHeight: '1.75',
                }}
              >
                {page.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
