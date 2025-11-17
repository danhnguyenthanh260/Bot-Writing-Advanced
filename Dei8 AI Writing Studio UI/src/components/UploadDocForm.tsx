import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface UploadDocFormProps {
  onUpload: (url: string) => Promise<void>;
}

export function UploadDocForm({ onUpload }: UploadDocFormProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setStatus('error');
      setMessage('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      await onUpload(url);
      setStatus('success');
      setMessage('Document analyzed successfully!');
      setUrl('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to analyze document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="p-5 rounded-xl"
      style={{
        backgroundColor: `rgb(var(--surface))`,
        border: `1px solid var(--border)`,
      }}
    >
      <div className="mb-4">
        <h3
          className="m-0 mb-2"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: `rgb(var(--text-primary))`,
          }}
        >
          Upload Google Docs
        </h3>
        <p className="text-sm m-0" style={{ color: `rgb(var(--text-muted))` }}>
          Paste a Google Docs URL to analyze your document
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/document/d/..."
          disabled={loading}
          className="w-full h-12 px-4 rounded-lg transition-fast"
          style={{
            backgroundColor: `rgb(var(--bg-soft))`,
            border: `1px solid var(--border)`,
            color: `rgb(var(--text-primary))`,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = `rgb(var(--primary))`;
            e.currentTarget.style.borderWidth = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = `var(--border)`;
            e.currentTarget.style.borderWidth = '1px';
          }}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-fast disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>Analyze</span>
            </>
          )}
        </button>

        {status === 'success' && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg"
            style={{ backgroundColor: `rgba(var(--success), 0.1)`, color: `rgb(var(--success))` }}
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">{message}</span>
          </div>
        )}

        {status === 'error' && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg"
            style={{ backgroundColor: `rgba(var(--error), 0.1)`, color: `rgb(var(--error))` }}
          >
            <XCircle className="w-4 h-4" />
            <span className="text-sm">{message}</span>
          </div>
        )}
      </form>
    </div>
  );
}
