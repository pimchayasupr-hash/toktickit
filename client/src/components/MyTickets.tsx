import React, { useState, useEffect } from 'react';
import { useRequester } from '../context/RequesterContext';
import { Ticket, Category, RelatedSystem, Pagination } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface MyTicketsProps {
  onSelectTicket: (ticketId: number) => void;
  onCreateNewClick: () => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({ onSelectTicket, onCreateNewClick }) => {
  const { selectedRequesterId } = useRequester();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, totalCount: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting State
  const [search, setSearch] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [relatedSystemId, setRelatedSystemId] = useState<string>('');
  const [requestedPriority, setRequestedPriority] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Reference options
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  useEffect(() => {
    // Load categories & related systems for filter dropdowns
    Promise.all([
      fetch(`${API_BASE_URL}/api/categories`).then((res) => res.json()),
      fetch(`${API_BASE_URL}/api/related-systems`).then((res) => res.json()),
    ]).then(([catData, sysData]) => {
      setCategories(Array.isArray(catData) ? catData : catData.categories || []);
      setRelatedSystems(sysData.relatedSystems || []);
    }).catch(() => {});
  }, []);

  const fetchTickets = async () => {
    if (!selectedRequesterId) return;

    setIsLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (search.trim()) queryParams.set('search', search.trim());
    if (categoryId) queryParams.set('categoryId', categoryId);
    if (relatedSystemId) queryParams.set('relatedSystemId', relatedSystemId);
    if (requestedPriority) queryParams.set('requestedPriority', requestedPriority);
    if (currentStatus) queryParams.set('currentStatus', currentStatus);
    queryParams.set('sortBy', sortBy);
    queryParams.set('sortOrder', sortOrder);
    queryParams.set('page', String(page));
    queryParams.set('limit', String(limit));

    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets?${queryParams.toString()}`, {
        headers: {
          'X-Development-Requester-Id': String(selectedRequesterId),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load tickets (HTTP ${res.status})`);
      }

      const data = await res.json();
      setTickets(data.tickets || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [selectedRequesterId, search, categoryId, relatedSystemId, requestedPriority, currentStatus, sortBy, sortOrder, page, limit]);

  const handleClearFilters = () => {
    setSearch('');
    setCategoryId('');
    setRelatedSystemId('');
    setRequestedPriority('');
    setCurrentStatus('');
    setSortBy('updatedAt');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || categoryId || relatedSystemId || requestedPriority || currentStatus);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 fw-bold text-success m-0">My IT Support Tickets</h2>
          <p className="text-muted small m-0">Track and review your submitted support requests</p>
        </div>
        <button type="button" className="btn btn-zen-primary" onClick={onCreateNewClick}>
          + Create Ticket
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="zen-card p-3 mb-4">
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search ticket # or summary..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={relatedSystemId}
              onChange={(e) => {
                setRelatedSystemId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Systems</option>
              {relatedSystems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={requestedPriority}
              onChange={(e) => {
                setRequestedPriority(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={currentStatus}
              onChange={(e) => {
                setCurrentStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="NEW">NEW</option>
            </select>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center pt-2 border-top">
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">Sort by:</span>
            <select
              className="form-select form-select-sm w-auto"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updatedAt">Last Updated</option>
              <option value="createdAt">Created Date</option>
              <option value="ticketNumber">Ticket Number</option>
              <option value="summary">Summary</option>
            </select>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '⬆ Ascending' : '⬇ Descending'}
            </button>
          </div>

          {hasActiveFilters && (
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleClearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Content States */}
      {isLoading && (
        <div className="text-center py-5 zen-card">
          <div className="spinner-border text-success" role="status"></div>
          <p className="text-muted mt-2">Loading your tickets...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <h6 className="fw-bold mb-1">Failed to load tickets</h6>
          <p className="mb-0 small">{error}</p>
        </div>
      )}

      {!isLoading && !error && tickets.length === 0 && !hasActiveFilters && (
        <div className="text-center py-5 zen-card bg-zen-pale">
          <span className="display-4">🎟️</span>
          <h4 className="fw-bold text-success mt-3">No Tickets Found</h4>
          <p className="text-muted mb-3">You have not submitted any IT support tickets yet.</p>
          <button type="button" className="btn btn-zen-primary" onClick={onCreateNewClick}>
            Create Your First Ticket
          </button>
        </div>
      )}

      {!isLoading && !error && tickets.length === 0 && hasActiveFilters && (
        <div className="text-center py-5 zen-card">
          <span className="display-5">🔍</span>
          <h5 className="fw-bold mt-2">No Matching Tickets</h5>
          <p className="text-muted mb-3">No tickets matched your current search and filter criteria.</p>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleClearFilters}>
            Clear Search & Filters
          </button>
        </div>
      )}

      {!isLoading && !error && tickets.length > 0 && (
        <>
          {/* Desktop Table Layout */}
          <div className="desktop-table-container zen-card overflow-hidden mb-3">
            <table className="table table-hover align-middle mb-0 zen-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Summary</th>
                  <th>Category</th>
                  <th>System</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="cursor-pointer" onClick={() => onSelectTicket(t.id)}>
                    <td className="fw-bold text-success">{t.ticketNumber}</td>
                    <td className="fw-semibold text-dark">{t.summary}</td>
                    <td>
                      <span className="badge bg-light text-dark border">{t.category?.name}</span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{t.relatedSystem?.name}</span>
                    </td>
                    <td>
                      <span className={`badge badge-priority-${t.requestedPriority.toLowerCase()}`}>
                        {t.requestedPriority}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-status-new">{t.currentStatus}</span>
                    </td>
                    <td className="small text-muted">{new Date(t.updatedAt).toLocaleDateString()}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-zen-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(t.id);
                        }}
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards Layout */}
          <div className="mobile-card-container mb-3">
            <div className="d-flex flex-column gap-3">
              {tickets.map((t) => (
                <div key={t.id} className="zen-card p-3" onClick={() => onSelectTicket(t.id)}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="fw-bold text-success">{t.ticketNumber}</span>
                    <span className={`badge badge-priority-${t.requestedPriority.toLowerCase()}`}>
                      {t.requestedPriority}
                    </span>
                  </div>
                  <h6 className="fw-bold mb-2">{t.summary}</h6>
                  <div className="d-flex flex-wrap gap-1 mb-2">
                    <span className="badge bg-light text-dark border extra-small">{t.category?.name}</span>
                    <span className="badge bg-light text-dark border extra-small">{t.relatedSystem?.name}</span>
                    <span className="badge badge-status-new extra-small">{t.currentStatus}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top extra-small text-muted">
                    <span>Updated: {new Date(t.updatedAt).toLocaleDateString()}</span>
                    <span className="text-success fw-bold">View Detail →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="zen-card p-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2 small text-muted">
              <span>Showing {tickets.length} of {pagination.totalCount} tickets</span>
              <span className="ms-3">Per page:</span>
              <select
                className="form-select form-select-sm w-auto"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </button>
              <span className="small fw-semibold px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
