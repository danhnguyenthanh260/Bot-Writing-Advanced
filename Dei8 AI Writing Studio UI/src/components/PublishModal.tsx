import React, { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (platform: string, settings: any) => Promise<void>;
}

export function PublishModal({ isOpen, onClose, onPublish }: PublishModalProps) {
  const [platform, setPlatform] = useState('medium');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onPublish(platform, { title, tags: tags.split(',').map((t) => t.trim()) });
      onClose();
    } catch (error) {
      console.error('Failed to publish:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(44, 36, 22, 0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[600px] rounded-2xl shadow-xlarge p-8"
        style={{ backgroundColor: `rgb(var(--surface))` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="m-0"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: `rgb(var(--text-primary))`,
            }}
          >
            Publish Document
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-fast"
            style={{ color: `rgb(var(--text-muted))` }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `rgb(var(--surface-hover))`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              className="block mb-2 text-sm"
              style={{ color: `rgb(var(--text-muted))` }}
            >
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full h-12 px-4 rounded-lg transition-fast"
              style={{
                backgroundColor: `rgb(var(--bg-soft))`,
                border: `1px solid var(--border)`,
                color: `rgb(var(--text-primary))`,
              }}
            >
              <option value="medium">Medium</option>
              <option value="substack">Substack</option>
              <option value="wordpress">WordPress</option>
              <option value="ghost">Ghost</option>
            </select>
          </div>

          <div>
            <label
              className="block mb-2 text-sm"
              style={{ color: `rgb(var(--text-muted))` }}
            >
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter publication title"
              required
              className="w-full h-12 px-4 rounded-lg transition-fast"
              style={{
                backgroundColor: `rgb(var(--bg-soft))`,
                border: `1px solid var(--border)`,
                color: `rgb(var(--text-primary))`,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = `rgb(var(--primary))`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = `var(--border)`;
              }}
            />
          </div>

          <div>
            <label
              className="block mb-2 text-sm"
              style={{ color: `rgb(var(--text-muted))` }}
            >
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="writing, technology, ai"
              className="w-full h-12 px-4 rounded-lg transition-fast"
              style={{
                backgroundColor: `rgb(var(--bg-soft))`,
                border: `1px solid var(--border)`,
                color: `rgb(var(--text-primary))`,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = `rgb(var(--primary))`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = `var(--border)`;
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-lg transition-fast"
              style={{
                border: `2px solid rgb(var(--primary))`,
                color: `rgb(var(--primary))`,
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `rgba(var(--primary), 0.05)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-lg flex items-center justify-center gap-2 transition-fast disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: `rgb(var(--primary))`,
                color: 'white',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = `rgb(var(--primary-dark))`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `rgb(var(--primary))`;
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Publish</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
