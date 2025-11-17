import React, { useState } from 'react';
import type { GoogleDocIngestResponse } from '../types';

interface UploadDocFormProps {
  onSuccess: (payload: GoogleDocIngestResponse) => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const normalizeBaseUrl = (value: string) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

const resolveBaseUrl = () => {
  const explicit = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? '');
  if (explicit) {
    return explicit;
  }

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    return normalizeBaseUrl(window.location.origin);
  }

  return 'http://localhost:3001';
};

const UploadDocForm: React.FC<UploadDocFormProps> = ({ onSuccess }) => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setStatus('loading');
    setErrorMessage(null);

    try {
      const base = resolveBaseUrl();
      const response = await fetch(`${base}/api/google-docs/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = (await response.json().catch(() => ({}))) as Partial<GoogleDocIngestResponse> & {
        error?: string;
      };

      if (!response.ok) {
        const message = data?.error ?? 'Không thể phân tích tài liệu Google Docs.';
        throw new Error(message);
      }

      if (!data || !data.workProfile || !data.document) {
        throw new Error('Phản hồi từ máy chủ không đầy đủ.');
      }

      onSuccess(data as GoogleDocIngestResponse);
      setStatus('success');
      setUrl('');
    } catch (error: any) {
      console.error('Failed to ingest Google Doc', error);
      setStatus('error');
      if (error?.name === 'TypeError') {
        setErrorMessage(
          'Không thể kết nối tới máy chủ backend. Hãy đảm bảo bạn đã chạy `npm run server` và cho phép truy cập từ trình duyệt.',
        );
        return;
      }

      setErrorMessage(error?.message ?? 'Đã xảy ra lỗi không xác định.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 mb-4 shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)]">
      <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2" style={{ fontFamily: 'var(--font-sans)' }}>
        Upload Google Docs
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] mb-4">
        Paste a Google Docs URL to analyze your document
      </p>
      <div className="space-y-3">
        <input
          id="google-doc-url"
          type="url"
          placeholder="https://docs.google.com/document/d/..."
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="w-full h-12 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] transition-all"
          style={{ fontSize: '14px' }}
          disabled={status === 'loading'}
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full h-12 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-on-primary)] font-semibold rounded-lg shadow-[var(--shadow-lg)] disabled:shadow-none transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
          style={{ fontSize: '16px' }}
        >
          {status === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang phân tích...
            </span>
          ) : 'Phân tích'}
        </button>
      </div>
      {status === 'loading' && (
        <p className="text-xs text-[var(--color-text-muted)] mt-2">Đang truy vấn Google Docs, vui lòng chờ trong giây lát...</p>
      )}
      {status === 'success' && (
        <p className="text-xs text-[var(--color-success)] mt-2">Đã tải thành công! Hồ sơ tác phẩm đang được cập nhật.</p>
      )}
      {status === 'error' && errorMessage && (
        <p className="text-xs text-[var(--color-error)] mt-2">{errorMessage}</p>
      )}
    </form>
  );
};

export default UploadDocForm;