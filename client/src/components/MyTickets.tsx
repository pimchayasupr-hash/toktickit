import React, { useState, useEffect, useCallback } from 'react';
import { useRequester } from '../context/RequesterContext';
import { Ticket, Category, RelatedSystem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface MyTicketsProps {
  onSelectTicket: (ticketId: number) => void;
  onCreateNewTicket: () => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({ onSelectTicket, onCreateNewTicket }) => {
  const { selectedRequesterId } = useRequester();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  // Filter & Search State
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSystem, setSelectedSystem] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [sort, setSort] = useState<string>('updatedAt_desc');

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalTickets, setTotalTickets] = useState<number>(0);

  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load reference categories & related systems
  useEffect(() => {
    const fetchReferences = async () => {
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
        // Silent reference fail fallback
      }
    };

    fetchReferences();
  }, []);

  // Fetch Tickets
  const fetchTickets = useCallback(async () => {
    if (!selectedRequesterId) return;

    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (selectedCategory) params.append('categoryId', selectedCategory);
    if (selectedSystem) params.append('relatedSystemId', selectedSystem);
    if (selectedPriority) params.append('priority', selectedPriority);
    if (sort) params.append('sort', sort);
    params.append('page', String(page));
    params.append('pageSize', '10');

    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets?${params.toString()}`, {
        headers: {
          'X-Development-Requester-Id': String(selectedRequesterId),
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load tickets.`);
      }

      const data = await res.json();
      setTickets(data.tickets || []);
      setTotalTickets(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to service.');
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRequesterId, search, selectedCategory, selectedSystem, selectedPriority, sort, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedSystem('');
    setSelectedPriority('');
    setSort('updatedAt_desc');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || selectedCategory || selectedSystem || selectedPriority);

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="h3 fw-bold text-success m-0">My Support Tickets</h2>
          <p className="text-muted small m-0">Track and manage your submitted IT requests</p>
        </div>
        <button type="button" className="btn btn-zen-primary shadow-sm" onClick={onCreateNewTicket}>
          + Create New Ticket
        </button>
      </div>

      {/* Search and Filters Card */}
      <div className="zen-card p-3 mb-4">
        <div className="row g-2 mb-3">
          {/* Search Input */}
          <div className="col-12 col-md-4">
            <label className="form-label small text-muted mb-1">Search Keywords</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search by ticket number, summary..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Category Filter */}
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1">Category</label>
            <select
              className="form-select form-select-sm"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
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

          {/* System Filter */}
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1">System</label>
            <select
              className="form-select form-select-sm"
              value={selectedSystem}
              onChange={(e) => {
                setSelectedSystem(e.target.value);
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

          {/* Priority Filter */}
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1">Priority</label>
            <select
              className="form-select form-select-sm"
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="col-6 col-md-2">
            <label className="form-label small text-muted mb-1">Sort By</label>
            <select className="form-select form-select-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="updatedAt_desc">Last Updated (Newest)</option>
              <option value="updatedAt_asc">Last Updated (Oldest)</option>
              <option value="createdAt_desc">Date Created (Newest)</option>
              <option value="createdAt_asc">Date Created (Oldest)</option>
              <option value="priority_desc">Priority (High to Low)</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="d-flex justify-content-between align-items-center pt-2 border-top extra-small">
            <span className="text-muted">Filtering active criteria</span>
            <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none text-danger" onClick={handleClearFilters}>
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="text-muted small mt-2">Loading your tickets...</p>
        </div>
      )}

      {/* Error Alert */}
      {error && !isLoading && (
        <div className="alert alert-danger p-3 my-3" role="alert">
          <h6 className="fw-bold mb-1">Error Loading Tickets</h6>
          <p className="mb-0 small">{error}</p>
        </div>
      )}

      {/* Content Area */}
      {!isLoading && !error && (
        <>
          {tickets.length === 0 ? (
            <div className="zen-card text-center py-5 px-3">
              <div className="display-6 text-muted mb-2">📋</div>
              {hasActiveFilters ? (
                <>
                  <h5 className="fw-bold text-secondary">No Matching Tickets Found</h5>
                  <p className="text-muted small">Try adjusting your keywords or filter parameters.</p>
                  <button type="button" className="btn btn-sm btn-outline-secondary mt-2" onClick={handleClearFilters}>
                    Clear Search Filters
                  </button>
                </>
              ) : (
                <>
                  <h5 className="fw-bold text-secondary">No Tickets Created Yet</h5>
                  <p className="text-muted small">You haven't submitted any support requests under this account.</p>
                  <button type="button" className="btn btn-zen-primary btn-sm mt-2" onClick={onCreateNewTicket}>
                    Create Your First Ticket
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="d-none d-lg-block zen-card overflow-hidden p-0 mb-4">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="py-3 ps-4">Ticket No.</th>
                      <th className="py-3">Summary</th>
                      <th className="py-3">Category</th>
                      <th className="py-3">Related System</th>
                      <th className="py-3">Priority</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 pe-4 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id}>
                        <td className="ps-4 fw-bold text-success">{t.ticketNumber}</td>
                        <td className="fw-medium">{t.summary}</td>
                        <td>
                          <span className="badge bg-light text-dark border">{t.category?.name}</span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">{t.relatedSystem?.name}</span>
                        </td>
                        <td>
                          <span className={`badge badge-priority-${t.requestedPriority.toLowerCase()}`}>{t.requestedPriority}</span>
                        </td>
                        <td>
                          <span className="badge bg-success-subtle text-success border border-success-subtle">NEW</span>
                        </td>
                        <td className="pe-4 text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() => onSelectTicket(t.id)}
                          >
                            View Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Tablet Card View */}
              <div className="d-lg-none d-flex flex-column gap-3 mb-4">
                {tickets.map((t) => (
                  <div key={t.id} className="zen-card p-3" onClick={() => onSelectTicket(t.id)}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-success">{t.ticketNumber}</span>
                      <span className={`badge badge-priority-${t.requestedPriority.toLowerCase()}`}>{t.requestedPriority}</span>
                    </div>
                    <h6 className="fw-bold mb-2">{t.summary}</h6>
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      <span className="badge bg-light text-dark border">{t.category?.name}</span>
                      <span className="badge bg-light text-dark border">{t.relatedSystem?.name}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top extra-small text-muted">
                      <span>Status: NEW</span>
                      <span className="text-success fw-bold">View Detail →</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">
                    Showing page {page} of {totalPages} ({totalTickets} total tickets)
                  </span>
                  <div className="btn-group btn-group-sm">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      ← Previous
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
