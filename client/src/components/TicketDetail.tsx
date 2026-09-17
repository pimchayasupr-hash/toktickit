import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Ticket, Attachment } from '../types';
import { PublicCommentsSection } from './comments/PublicCommentsSection';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface TicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onBack }) => {
  const { token } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Soft Removal Modal State
  const [removingAttachment, setRemovingAttachment] = useState<Attachment | null>(null);
  const [removalReason, setRemovalReason] = useState<string>('');
  const [isRemoving, setIsRemoving] = useState<boolean>(false);
  const [removalError, setRemovalError] = useState<string | null>(null);

  // Problem Appears Resolved State
  const [resolvingState, setResolvingState] = useState(false);
  const [resolveMessage, setResolveMessage] = useState<string | null>(null);

  const fetchTicketDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `HTTP ${res.status}: Failed to load ticket details.`);
      }

      setTicket(data.ticket);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to server.');
      setTicket(null);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, token]);

  useEffect(() => {
    fetchTicketDetail();
  }, [fetchTicketDetail]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadError(null);
    setUploadSuccess(null);

    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const fileExt = '.' + (selectedFile.name.split('.').pop() || '').toLowerCase();

    if (!ALLOWED_TYPES.includes(selectedFile.type.toLowerCase()) && !ALLOWED_EXTS.includes(fileExt)) {
      setUploadError(`Invalid file type "${selectedFile.name}". Allowed formats are JPG, PNG, WEBP, and PDF.`);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadError(`File "${selectedFile.name}" exceeds the 5 MB size limit (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to upload attachment.');

      setUploadSuccess(`Attachment "${selectedFile.name}" uploaded successfully!`);
      setSelectedFile(null);
      fetchTicketDetail();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removingAttachment) return;

    const trimmedReason = removalReason.trim();
    if (trimmedReason.length < 3 || trimmedReason.length > 200) {
      setRemovalError('Removal reason must be between 3 and 200 characters.');
      return;
    }

    setIsRemoving(true);
    setRemovalError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/attachments/${removingAttachment.id}/remove`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ removalReason: trimmedReason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to remove attachment.');

      setRemovingAttachment(null);
      setRemovalReason('');
      fetchTicketDetail();
    } catch (err: any) {
      setRemovalError(err.message || 'Removal failed.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleProblemResolved = async () => {
    setResolvingState(true);
    setResolveMessage(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: '[SYSTEM]: Requester indicated that the problem appears resolved.' }),
      });

      if (!res.ok) throw new Error('Failed to post resolution indicator.');
      setResolveMessage('Thank you! IT Staff has been notified that your problem appears resolved.');
      fetchTicketDetail();
    } catch (err: any) {
      setResolveMessage('Failed to post status update.');
    } finally {
      setResolvingState(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center" data-testid="ticket-detail-loading">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
        <p className="mt-2 text-sm text-slate-500">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <button onClick={onBack} className="text-xs font-semibold text-emerald-800 hover:underline">
          ← Back to My Tickets
        </button>
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm" data-testid="ticket-detail-error">
          {error || 'Ticket not found.'}
        </div>
      </div>
    );
  }

  const activeAttachments = ticket.attachments?.filter((a) => !a.isRemoved) || [];
  const removedAttachments = ticket.attachments?.filter((a) => a.isRemoved) || [];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6" data-testid="ticket-detail-container">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-xs font-semibold text-[#005a36] hover:text-[#008751] flex items-center gap-1">
          ← Back to My Tickets
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            {ticket.ticketNumber}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            {ticket.currentStatus}
          </span>
        </div>
      </div>

      {/* Main Ticket Information */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
          <h2 className="text-xl font-bold text-slate-900">{ticket.summary}</h2>
          <button
            onClick={handleProblemResolved}
            disabled={resolvingState}
            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#005a36] font-semibold text-xs rounded-lg border border-emerald-300 transition-colors shadow-sm disabled:opacity-50"
          >
            {resolvingState ? 'Updating...' : '✓ Problem Appears Resolved'}
          </button>
        </div>

        {resolveMessage && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-lg text-xs font-medium">
            {resolveMessage}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Category</span>
            <span className="font-semibold text-slate-800">{ticket.category.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Related System</span>
            <span className="font-semibold text-slate-800">{ticket.relatedSystem.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Requested Priority</span>
            <span className="font-semibold text-slate-800">{ticket.requestedPriority}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Date Created</span>
            <span className="font-semibold text-slate-800">{new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div>
          <span className="text-xs text-slate-400 block font-medium mb-1">Description</span>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap">
            {ticket.description}
          </div>
        </div>
      </div>

      {/* Attachments Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Attachments ({activeAttachments.length}/5)</h3>

        {uploadError && <div role="alert" className="bg-red-50 text-red-700 p-3 rounded-lg text-xs">{uploadError}</div>}
        {uploadSuccess && <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-xs font-medium">{uploadSuccess}</div>}

        {activeAttachments.length < 5 && (
          <form onSubmit={handleUploadSubmit} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-600"
            />
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="px-3 py-1.5 bg-[#005a36] hover:bg-[#008751] text-white font-semibold rounded-lg text-xs disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {activeAttachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-semibold text-slate-800">📎 {att.originalFilename} ({(att.sizeBytes / 1024).toFixed(1)} KB)</span>
              <div className="space-x-3">
                <a
                  href={`${API_BASE_URL}/api/attachments/${att.id}/download`}
                  download
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  Download
                </a>
                <button
                  onClick={() => setRemovingAttachment(att)}
                  className="text-red-600 font-semibold hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {removedAttachments.map((att) => (
            <div key={att.id} className="p-3 bg-red-50/50 rounded-lg border border-red-200/60 text-xs text-slate-500">
              <span className="line-through font-medium">📎 {att.originalFilename}</span>
              <span className="text-red-600 ml-2 italic">[Removed: {att.removalReason}]</span>
            </div>
          ))}
        </div>
      </div>

      {/* Public Comments Section */}
      <PublicCommentsSection
        ticketId={ticket.id}
        comments={ticket.publicComments || []}
        onCommentAdded={fetchTicketDetail}
      />

      {/* Soft Removal Modal */}
      {removingAttachment && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg space-y-4">
            <h4 className="font-bold text-slate-900 text-base">Remove Attachment</h4>
            <p className="text-xs text-slate-600">Please state the reason for removing "{removingAttachment.originalFilename}".</p>
            {removalError && <div role="alert" className="text-xs text-red-600 bg-red-50 p-2 rounded">{removalError}</div>}
            <form onSubmit={handleRemoveSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                placeholder="Reason for removal (3-200 chars)..."
                className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-emerald-600"
              />
              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRemovingAttachment(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRemoving}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-semibold disabled:opacity-50"
                >
                  {isRemoving ? 'Removing...' : 'Confirm Removal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
