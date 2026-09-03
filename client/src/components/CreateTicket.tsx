import React, { useState, useEffect } from 'react';
import { useRequester } from '../context/RequesterContext';
import type { Category, RelatedSystem, Ticket } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface CreateTicketProps {
  onSuccess: (createdTicket: Ticket) => void;
  onCancel?: () => void;
}

export const CreateTicket: React.FC<CreateTicketProps> = ({ onSuccess, onCancel }) => {
  const { selectedRequesterId, currentRequester } = useRequester();

  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [loadingReference, setLoadingReference] = useState<boolean>(true);

  // Form State
  const [categoryId, setCategoryId] = useState<string>('');
  const [relatedSystemId, setRelatedSystemId] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [requestedPriority, setRequestedPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [description, setDescription] = useState<string>('');

  // UI / Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

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
          setRelatedSystems(sysData.relatedSystems || []);
        }
      } catch (err) {
        setGeneralError('Failed to load reference data. Please try refreshing the page.');
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

    // Client validation
    const errors: Record<string, string> = {};
    if (!categoryId) errors.categoryId = 'Category is required.';
    if (!relatedSystemId) errors.relatedSystemId = 'Related System is required.';
    if (summary.trim().length < 5 || summary.trim().length > 150) {
      errors.summary = 'Summary must be between 5 and 150 characters.';
    }
    if (description.trim().length < 10 || description.trim().length > 2000) {
      errors.description = 'Description must be between 10 and 2000 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const clientSubmissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Development-Requester-Id': String(selectedRequesterId),
        },
        body: JSON.stringify({
          clientSubmissionId,
          categoryId: Number(categoryId),
          relatedSystemId: Number(relatedSystemId),
          summary: summary.trim(),
          requestedPriority,
          description: description.trim(),
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

      onSuccess(data.ticket);
    } catch (err: any) {
      setGeneralError(err.message || 'Unable to connect to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingReference) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-2 text-muted">Loading form reference data...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9">
          <div className="zen-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
              <div>
                <h2 className="h4 fw-bold text-success m-0">Create New IT Support Ticket</h2>
                <p className="text-muted small m-0">Submit an official IT support request</p>
              </div>
              {onCancel && (
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancel}>
                  Cancel
                </button>
              )}
            </div>

            {generalError && (
              <div className="alert alert-danger" role="alert">
                <h6 className="fw-bold mb-1">Submission Failed</h6>
                <p className="mb-0 small">{generalError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Read-Only System Values Section */}
              <div className="bg-zen-pale p-3 rounded mb-4">
                <h6 className="fw-bold text-success mb-3">System Generated Information (Read-Only)</h6>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label small text-muted mb-1">Ticket Number</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-white"
                      value="Auto-generated on submit"
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label small text-muted mb-1">Ticket Date</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-white"
                      value={new Date().toLocaleDateString()}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label small text-muted mb-1">Requester</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-white"
                      value={currentRequester ? `${currentRequester.name}` : ''}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Editable Fields Section */}
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <label htmlFor="ticket-category" className="form-label fw-semibold">
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    id="ticket-category"
                    className={`form-select ${fieldErrors.categoryId ? 'is-invalid' : ''}`}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.categoryId && <div className="invalid-feedback">{fieldErrors.categoryId}</div>}
                </div>

                <div className="col-12 col-md-6">
                  <label htmlFor="ticket-system" className="form-label fw-semibold">
                    Related System <span className="text-danger">*</span>
                  </label>
                  <select
                    id="ticket-system"
                    className={`form-select ${fieldErrors.relatedSystemId ? 'is-invalid' : ''}`}
                    value={relatedSystemId}
                    onChange={(e) => setRelatedSystemId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Related System --</option>
                    {relatedSystems.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.relatedSystemId && <div className="invalid-feedback">{fieldErrors.relatedSystemId}</div>}
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="ticket-summary" className="form-label fw-semibold">
                  Ticket Summary <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="ticket-summary"
                  className={`form-control ${fieldErrors.summary ? 'is-invalid' : ''}`}
                  placeholder="Brief description of the issue (5 - 150 characters)"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  maxLength={150}
                  required
                />
                <div className="d-flex justify-content-between mt-1">
                  {fieldErrors.summary ? (
                    <div className="text-danger small">{fieldErrors.summary}</div>
                  ) : (
                    <span className="text-muted extra-small">Minimum 5 characters</span>
                  )}
                  <span className="text-muted extra-small">{summary.length}/150</span>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Requested Priority <span className="text-danger">*</span>
                </label>
                <div className="d-flex flex-wrap gap-3">
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                    <div className="form-check" key={p}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="requestedPriority"
                        id={`priority-${p}`}
                        value={p}
                        checked={requestedPriority === p}
                        onChange={() => setRequestedPriority(p)}
                      />
                      <label className="form-check-label fw-medium" htmlFor={`priority-${p}`}>
                        <span className={`badge badge-priority-${p.toLowerCase()} me-1`}>{p}</span>
                      </label>
                    </div>
                  ))}
                </div>
                {fieldErrors.requestedPriority && <div className="text-danger small mt-1">{fieldErrors.requestedPriority}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="ticket-description" className="form-label fw-semibold">
                  Detailed Description <span className="text-danger">*</span>
                </label>
                <textarea
                  id="ticket-description"
                  rows={5}
                  className={`form-control ${fieldErrors.description ? 'is-invalid' : ''}`}
                  placeholder="Provide step-by-step details, error messages, and context (10 - 2000 characters)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  required
                ></textarea>
                <div className="d-flex justify-content-between mt-1">
                  {fieldErrors.description ? (
                    <div className="text-danger small">{fieldErrors.description}</div>
                  ) : (
                    <span className="text-muted extra-small">Minimum 10 characters</span>
                  )}
                  <span className="text-muted extra-small">{description.length}/2000</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex justify-content-end gap-2">
                {onCancel && (
                  <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn btn-zen-primary px-4" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Submitting Ticket...
                    </>
                  ) : (
                    'Submit Support Ticket'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
