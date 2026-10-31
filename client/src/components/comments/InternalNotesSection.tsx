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

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-GB', {
        timeZone: 'Asia/Bangkok',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      data-testid="internal-notes-card"
      style={{
        backgroundColor: '#FFFBEB',
        border: '1px solid #D97706',
        borderTop: '4px solid #D97706',
        borderRadius: '12px',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          paddingBottom: '0.75rem',
          marginBottom: '1rem',
          borderBottom: '1px solid #FDE68A',
        }}
      >
        <h3
          style={{
            color: '#78350F',
            margin: 0,
            fontSize: '1rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <svg
            width="18"
            height="18"
            style={{ color: '#B45309', flexShrink: 0 }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Private Internal Notes ({notes.length})
        </h3>
        <span
          style={{
            backgroundColor: '#FEF3C7',
            color: '#78350F',
            border: '1px solid #D97706',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            whiteSpace: 'nowrap',
          }}
        >
          CONFIDENTIAL • IT Staff &amp; Admins Only
        </span>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        {notes.length === 0 ? (
          <p style={{ color: '#92400E', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
            No internal notes recorded yet.
          </p>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #FDE68A',
                borderLeft: '4px solid #D97706',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#78350F', fontWeight: 700, fontSize: '0.85rem' }}>
                    {n.author.name}
                  </span>
                  <span
                    style={{
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                      border: '1px solid #D97706',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '4px',
                    }}
                  >
                    {n.author.role}
                  </span>
                </div>
                <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{formatDate(n.createdAt)}</span>
              </div>
              <p style={{ color: '#1E293B', fontSize: '0.875rem', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                {n.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Post Note Form */}
      {error && (
        <div
          role="alert"
          style={{
            fontSize: '0.8rem',
            color: '#DC2626',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            marginBottom: '0.75rem',
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ paddingTop: '0.75rem', borderTop: '1px solid #FDE68A' }}
      >
        <textarea
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a confidential internal note (hidden from requester)..."
          style={{
            width: '100%',
            padding: '0.65rem 0.75rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            backgroundColor: '#FFFFFF',
            border: '1px solid #D97706',
            marginBottom: '0.5rem',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: '#B45309',
              border: '1px solid #92400E',
              color: '#FFFFFF',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {submitting ? 'Saving Note...' : 'Add Internal Note'}
          </button>
        </div>
      </form>
    </div>
  );
};
