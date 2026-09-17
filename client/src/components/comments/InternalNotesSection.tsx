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
    <div className="bg-amber-50/60 p-5 rounded-xl border border-amber-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
        <h3 className="font-bold text-amber-900 text-base flex items-center gap-2">
          <span>🔒</span> Private Internal Notes ({notes.length})
        </h3>
        <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-semibold border border-amber-200">
          Visible ONLY to IT Staff & Admins
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <p className="text-xs text-amber-700/80 italic py-2">No internal notes recorded yet.</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="p-3 bg-white/90 rounded-lg border border-amber-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  {n.author.name}
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-mono">
                    {n.author.role}
                  </span>
                </span>
                <span className="text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-800 whitespace-pre-wrap">{n.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Post Note Form */}
      {error && <div role="alert" className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-amber-200/60">
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a private internal note for staff..."
          className="w-full p-2.5 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving Note...' : 'Add Internal Note'}
          </button>
        </div>
      </form>
    </div>
  );
};
