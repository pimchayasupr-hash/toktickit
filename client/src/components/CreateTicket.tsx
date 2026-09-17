import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Category, RelatedSystem, Ticket } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface CreateTicketProps {
  onSuccess: (createdTicket: Ticket) => void;
  onCancel?: () => void;
}

export const CreateTicket: React.FC<CreateTicketProps> = ({ onSuccess, onCancel }) => {
  const { token, user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [loadingReference, setLoadingReference] = useState<boolean>(true);

  // Form State
  const [categoryId, setCategoryId] = useState<string>('');
  const [relatedSystemId, setRelatedSystemId] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [requestedPriority, setRequestedPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [description, setDescription] = useState<string>('');

  // UI / Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const fetchReferenceData = async () => {
      setLoadingReference(true);
      try {
        const [catRes, sysRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/categories`),
          fetch(`${API_BASE_URL}/api/related-systems`),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(Array.isArray(catData) ? catData : catData.categories || []);
        }

        if (sysRes.ok) {
          const sysData = await sysRes.json();
          setRelatedSystems(Array.isArray(sysData) ? sysData : sysData.relatedSystems || []);
        }
      } catch (error) {
        console.error('Failed to load reference data:', error);
      } finally {
        setLoadingReference(false);
      }
    };

    fetchReferenceData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFieldErrors({});
    setGeneralError(null);

    const clientSubmissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    setIsSubmitting(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          clientSubmissionId,
          categoryId,
          relatedSystemId,
          summary,
          requestedPriority,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.fields) {
          setFieldErrors(data.error.fields);
        } else {
          setGeneralError(data.error?.message || 'Failed to create ticket.');
        }
        setIsSubmitting(false);
        return;
      }

      setCreatedTicket(data.ticket);
    } catch (err: any) {
      setGeneralError(err.message || 'Unable to connect to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingReference) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
        <p className="mt-2 text-sm text-slate-500">Loading form reference data...</p>
      </div>
    );
  }

  if (createdTicket) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h2 className="text-2xl font-extrabold text-emerald-800">Ticket Created Successfully!</h2>
          <p className="text-sm text-slate-600">
            Your IT support request has been registered in the TokTickIT system.
          </p>

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl max-w-sm mx-auto">
            <div className="text-xs text-slate-500 font-medium">Official Ticket Number</div>
            <div className="text-2xl font-mono font-bold text-emerald-900 mt-1">{createdTicket.ticketNumber}</div>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              type="button"
              className="px-5 py-2.5 bg-[#005a36] hover:bg-[#008751] text-white font-semibold rounded-lg text-sm shadow transition-colors"
              onClick={() => onSuccess(createdTicket)}
            >
              View Ticket Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Create New IT Support Ticket</h2>
        <p className="text-sm text-slate-600">Submit a detailed request for hardware, software, or network assistance.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        {/* Requester Identity Info */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-6 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Submitting Identity:</span>
          <span className="font-bold text-slate-800">{user?.name} ({user?.email})</span>
        </div>

        {generalError && (
          <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-lg text-sm">
            ⚠️ {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none ${
                  fieldErrors.categoryId ? 'border-red-500 bg-red-50' : 'border-slate-300'
                }`}
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {fieldErrors.categoryId && <p className="text-xs text-red-600 mt-1">{fieldErrors.categoryId}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Related System *</label>
              <select
                value={relatedSystemId}
                onChange={(e) => setRelatedSystemId(e.target.value)}
                className={`w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none ${
                  fieldErrors.relatedSystemId ? 'border-red-500 bg-red-50' : 'border-slate-300'
                }`}
              >
                <option value="">-- Select Related System --</option>
                {relatedSystems.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {fieldErrors.relatedSystemId && <p className="text-xs text-red-600 mt-1">{fieldErrors.relatedSystemId}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Ticket Summary *</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary of the issue (5-150 characters)..."
              className={`w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none ${
                fieldErrors.summary ? 'border-red-500 bg-red-50' : 'border-slate-300'
              }`}
            />
            {fieldErrors.summary && <p className="text-xs text-red-600 mt-1">{fieldErrors.summary}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Requested Priority *</label>
            <div className="flex gap-4">
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                <label key={p} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={requestedPriority === p}
                    onChange={() => setRequestedPriority(p)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Detailed Description *</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details of what happened, error messages, or steps to reproduce (10-2000 characters)..."
              className={`w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none ${
                fieldErrors.description ? 'border-red-500 bg-red-50' : 'border-slate-300'
              }`}
            />
            {fieldErrors.description && <p className="text-xs text-red-600 mt-1">{fieldErrors.description}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#005a36] hover:bg-[#008751] text-white text-sm font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
