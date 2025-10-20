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
      const base = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? '');
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
      setErrorMessage(error?.message ?? 'Đã xảy ra lỗi không xác định.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 mb-4">
      <label htmlFor="google-doc-url" className="block text-sm font-medium text-slate-300 mb-2">
        Phân tích Google Docs
      </label>
      <div className="flex gap-2">
        <input
          id="google-doc-url"
          type="url"
          placeholder="Dán URL Google Docs..."
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="flex-1 rounded-lg bg-slate-800 border border-slate-700 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
          disabled={status === 'loading'}
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg"
        >
          {status === 'loading' ? 'Đang tải...' : 'Phân tích'}
        </button>
      </div>
      {status === 'loading' && (
        <p className="text-xs text-slate-400 mt-2">Đang truy vấn Google Docs, vui lòng chờ trong giây lát...</p>
      )}
      {status === 'success' && (
        <p className="text-xs text-emerald-400 mt-2">Đã tải thành công! Hồ sơ tác phẩm đang được cập nhật.</p>
      )}
      {status === 'error' && errorMessage && (
        <p className="text-xs text-rose-400 mt-2">{errorMessage}</p>
      )}
    </form>
  );
};

export default UploadDocForm;