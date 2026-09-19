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

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {/* Add Public Comment Box */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
          Add Public Comment
        </h4>

        {error && (
          <div role="alert" className="tkt-alert-error" style={{ marginBottom: '0.75rem' }}>
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <textarea
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your comment here..."
              className="tkt-input"
              style={{ flex: 1, resize: 'vertical' }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="tkt-btn-primary"
              style={{ width: 'auto', padding: '0.65rem 1.25rem', whiteSpace: 'nowrap' }}
            >
              <span>✈️</span> {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div>
        {comments.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', padding: '1rem 0' }}>
            No public comments yet.
          </p>
        ) : (
          comments.map((c) => {
            const roleBadgeClass =
              c.author.role === 'STAFF'
                ? 'tkt-pill tkt-pill-status-open'
                : c.author.role === 'ADMIN'
                ? 'tkt-pill tkt-pill-priority-high'
                : 'tkt-pill tkt-pill-status-in-progress';

            const roleDisplayName =
              c.author.role === 'STAFF'
                ? 'IT Support'
                : c.author.role === 'ADMIN'
                ? 'Administrator'
                : 'Requester';

            return (
              <div key={c.id} className="tkt-comment-item">
                <div className="tkt-comment-avatar">
                  {getInitials(c.author.name)}
                </div>

                <div className="tkt-comment-content">
                  <div className="tkt-comment-meta">
                    <div className="tkt-comment-author-info">
                      <span className="tkt-comment-author">{c.author.name}</span>
                      <span className={roleBadgeClass} style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                        {roleDisplayName}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="tkt-comment-time">{formatDate(c.createdAt)}</span>
                      <span style={{ color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }} title="Options">
                        ⋮
                      </span>
                    </div>
                  </div>

                  <p className="tkt-comment-body">{c.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
