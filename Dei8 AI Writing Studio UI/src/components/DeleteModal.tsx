import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  itemName: string;
}

export function DeleteModal({ isOpen, onClose, onDelete, itemName }: DeleteModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Failed to delete:', error);
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
        className="w-full max-w-[500px] rounded-2xl shadow-xlarge p-8"
        style={{ backgroundColor: `rgb(var(--surface))` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon & Header */}
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          >
            <AlertTriangle className="w-8 h-8" style={{ color: `rgb(var(--error))` }} />
          </div>
          <h2
            className="m-0 mb-2"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: `rgb(var(--text-primary))`,
            }}
          >
            Delete Project?
          </h2>
          <p className="m-0" style={{ color: `rgb(var(--text-muted))` }}>
            Are you sure you want to delete "<strong>{itemName}</strong>"?
          </p>
          <p className="m-0 mt-2 text-sm" style={{ color: `rgb(var(--text-subtle))` }}>
            This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-12 rounded-lg transition-fast"
            style={{
              border: `1px solid var(--border)`,
              color: `rgb(var(--text-primary))`,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `rgb(var(--surface-hover))`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 h-12 rounded-lg flex items-center justify-center gap-2 transition-fast disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: `rgb(var(--error))`,
              color: 'white',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = 'rgb(220, 38, 38)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `rgb(var(--error))`;
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
