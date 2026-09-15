import React, { useState } from 'react';
import type { PublicComment } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface PublicCommentsSectionProps {
  ticketId: number;
  comments: PublicComment[];
  onCommentAdded: () => void;
}

export const PublicCommentsSection: React.FC<PublicCommentsSectionProps> = ({ ticketId, comments, onCommentAdded }) => {
  const { token } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = content.trim();
    if (!trimmed) {
      setError('Comment content cannot be empty.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to post comment.');
      }

      setContent('');
      onCommentAdded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <span>💬</span> Public Comments ({comments.length})
        </h3>
        <span className="text-xs text-slate-500">Visible to Requester, IT Staff & Admins</span>
      </div>

      {/* Timeline */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">No public comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  {c.author.name}
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700 font-mono">
                    {c.author.role}
                  </span>
                </span>
                <span className="text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Post Comment Form */}
      {error && <div role="alert" className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-slate-100">
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a public comment..."
          className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-[#005a36] hover:bg-[#008751] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
};
