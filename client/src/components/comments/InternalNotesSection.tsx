import React, { useState } from 'react';
import type { InternalNote } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface InternalNotesSectionProps {
  ticketId: number;
  notes: InternalNote[];
  onNoteAdded: () => void;
}

export const InternalNotesSection: React.FC<InternalNotesSectionProps> = ({ ticketId, notes, onNoteAdded }) => {
  const { token } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = content.trim();
    if (!trimmed) {
      setError('Internal note content cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to add internal note.');
      }

      setContent('');
      onNoteAdded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="p-5 rounded-xl shadow-sm space-y-4"
      style={{
        backgroundColor: '#FFFBEB',
        border: '1px solid #F59E0B',
        borderTop: '4px solid #D97706',
        borderRadius: '12px',
        padding: '1.25rem',
      }}
    >
      <div
        className="flex items-center justify-between pb-3"
        style={{ borderBottom: '1px solid #FDE68A' }}
      >
        <h3
          className="font-bold text-base flex items-center gap-2"
          style={{ color: '#78350F', margin: 0, fontSize: '1rem', fontWeight: 700 }}
        >
          <svg
            width="18"
            height="18"
            className="w-4 h-4"
            style={{ color: '#B45309' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Private Internal Notes ({notes.length})
        </h3>
        <span
          className="text-xs px-2.5 py-0.5 rounded-full font-bold"
          style={{
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #F59E0B',
            fontSize: '0.7rem',
          }}
        >
          CONFIDENTIAL • IT Staff &amp; Admins Only
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <p className="text-xs italic py-2" style={{ color: '#92400E' }}>
            No internal notes recorded yet.
          </p>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className="p-3 rounded-lg space-y-1"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #FDE68A',
                borderLeft: '4px solid #D97706',
              }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-1.5" style={{ color: '#78350F' }}>
                  {n.author.name}
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }}
                  >
                    {n.author.role}
                  </span>
                </span>
                <span className="text-slate-500">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-800 whitespace-pre-wrap" style={{ margin: '0.35rem 0 0 0' }}>
                {n.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Post Note Form */}
      {error && <div role="alert" className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      <form
        onSubmit={handleSubmit}
        className="space-y-2 pt-3"
        style={{ borderTop: '1px solid #FDE68A' }}
      >
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a confidential internal note (hidden from requester)..."
          className="w-full p-2.5 rounded-lg text-sm bg-white"
          style={{ border: '1px solid #F59E0B' }}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            style={{ backgroundColor: '#B45309', border: '1px solid #92400E', cursor: 'pointer' }}
          >
            <svg width="14" height="14" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {submitting ? 'Saving Note...' : 'Add Internal Note'}
          </button>
        </div>
      </form>
    </div>
  );
};
