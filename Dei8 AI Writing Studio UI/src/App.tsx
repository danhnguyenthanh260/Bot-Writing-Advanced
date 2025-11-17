import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DocumentCanvas } from './components/DocumentCanvas';
import { ChatWidget } from './components/ChatWidget';
import { PublishModal } from './components/PublishModal';
import { DeleteModal } from './components/DeleteModal';
import { ToastContainer } from './components/Toast';

interface Project {
  id: string;
  title: string;
  wordCount: number;
  chapters: number;
  lastUpdated: string;
}

function AppContent() {
  const { showToast } = useToast();
  
  // User state
  const [user, setUser] = useState<{ name: string; avatar: string } | null>(null);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      title: 'The Art of Digital Writing',
      wordCount: 2500,
      chapters: 5,
      lastUpdated: 'Updated 2 hours ago',
    },
    {
      id: '2',
      title: 'AI in Modern Literature',
      wordCount: 4200,
      chapters: 8,
      lastUpdated: 'Updated yesterday',
    },
    {
      id: '3',
      title: 'Creative Writing Guide',
      wordCount: 1800,
      chapters: 3,
      lastUpdated: 'Updated 3 days ago',
    },
  ]);

  const [activeProjectId, setActiveProjectId] = useState<string | null>('1');
  const [hasDocument, setHasDocument] = useState(false);

  // Modal states
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string>('');

  // Handlers
  const handleLogin = () => {
    // Mock login
    setUser({
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    });
    showToast('success', 'Successfully signed in with Google');
  };

  const handleLogout = () => {
    setUser(null);
    showToast('info', 'Successfully logged out');
  };

  const handleUpload = async (url: string) => {
    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setHasDocument(true);
    showToast('success', 'Document analyzed successfully!');
  };

  const handleCreateNew = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: 'Untitled Project',
      wordCount: 0,
      chapters: 0,
      lastUpdated: 'Just now',
    };
    setProjects([newProject, ...projects]);
    setActiveProjectId(newProject.id);
    showToast('success', 'New project created');
  };

  const handlePublish = async (platform: string, settings: any) => {
    // Simulate publish
    await new Promise((resolve) => setTimeout(resolve, 2000));
    showToast('success', `Successfully published to ${platform}`);
  };

  const handleDelete = async () => {
    // Simulate delete
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setProjects(projects.filter((p) => p.id !== itemToDelete));
    if (activeProjectId === itemToDelete) {
      setActiveProjectId(projects[0]?.id || null);
    }
    showToast('success', 'Project deleted');
  };

  return (
    <div className="min-h-screen">
      <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />
      
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onProjectClick={setActiveProjectId}
        onUpload={handleUpload}
        onCreateNew={handleCreateNew}
      />

      <DocumentCanvas
        hasDocument={hasDocument}
        onUploadClick={() => {
          const uploadSection = document.querySelector('input[type="text"]') as HTMLInputElement;
          uploadSection?.focus();
        }}
      />

      <ChatWidget />

      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onPublish={handlePublish}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
        itemName={projects.find((p) => p.id === itemToDelete)?.title || ''}
      />

      <ToastContainer />

      {/* Floating Action Buttons (for demo) */}
      <div className="fixed bottom-24 left-5 flex flex-col gap-3">
        <button
          onClick={() => setShowPublishModal(true)}
          className="px-4 py-2 rounded-lg shadow-medium transition-fast"
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
          Test Publish Modal
        </button>
        <button
          onClick={() => {
            setItemToDelete('1');
            setShowDeleteModal(true);
          }}
          className="px-4 py-2 rounded-lg shadow-medium transition-fast"
          style={{
            backgroundColor: `rgb(var(--error))`,
            color: 'white',
          }}
        >
          Test Delete Modal
        </button>
        <button
          onClick={() => setHasDocument(!hasDocument)}
          className="px-4 py-2 rounded-lg shadow-medium transition-fast"
          style={{
            backgroundColor: `rgb(var(--primary))`,
            color: 'white',
          }}
        >
          Toggle Document
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
