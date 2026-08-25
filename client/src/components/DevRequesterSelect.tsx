import React, { useState } from 'react';
import { useRequester } from '../context/RequesterContext';

export const DevRequesterSelect: React.FC = () => {
  const { requesters, selectRequester, isLoading, error, refetchRequesters } = useRequester();
  const [selectedId, setSelectedId] = useState<number | ''>('');

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof selectedId === 'number' && selectedId > 0) {
      selectRequester(selectedId);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="zen-card p-4">
            <div className="text-center mb-4">
              <span className="display-4">🎟️</span>
              <h1 className="h3 fw-bold text-success mt-2">TokTickIT Service Desk</h1>
              <p className="text-muted small">Lab 2 Testing Environment</p>
            </div>

            <div className="alert alert-info border-0 bg-zen-pale mb-4" role="alert">
              <div className="d-flex">
                <span className="me-2 fs-5">ℹ️</span>
                <div className="small">
                  <strong>Development Requester Selection</strong>
                  <br />
                  Select a Development Requester to test requester-specific ticket behavior. This is not a login screen. Authentication and role-based access will be introduced in Lab 3.
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="text-center py-4">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading requesters...</span>
                </div>
                <p className="text-muted mt-2 small">Loading active Development Requesters...</p>
              </div>
            )}

            {error && (
              <div className="alert alert-danger" role="alert">
                <h6 className="fw-bold mb-1">Failed to load Requesters</h6>
                <p className="small mb-2">{error}</p>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={refetchRequesters}>
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !error && requesters.length === 0 && (
              <div className="alert alert-warning text-center" role="alert">
                No active Development Requesters available in PostgreSQL database.
              </div>
            )}

            {!isLoading && !error && requesters.length > 0 && (
              <form onSubmit={handleContinue}>
                <div className="mb-4">
                  <label htmlFor="requester-select" className="form-label fw-bold">
                    Select Active Development Requester <span className="text-danger">*</span>
                  </label>
                  <select
                    id="requester-select"
                    className="form-select form-select-lg"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : '')}
                    required
                  >
                    <option value="">-- Choose a Development Requester --</option>
                    {requesters.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-zen-primary btn-lg"
                    disabled={!selectedId}
                  >
                    Continue to Application →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
