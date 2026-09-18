import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Ticket, Category, RelatedSystem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface MyTicketsProps {
  onSelectTicket: (ticketId: number) => void;
  onCreateNewTicket: () => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({ onSelectTicket, onCreateNewTicket }) => {
  const { token } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  // Filter & Search State
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSystem, setSelectedSystem] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [sort, setSort] = useState<string>('updatedAt_desc');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalTickets, setTotalTickets] = useState<number>(0);

  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err) {}
    };

    fetchReferences();
  }, []);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (selectedSystem) params.append('relatedSystemId', selectedSystem);
      if (selectedPriority) params.append('priority', selectedPriority);
      if (sort) params.append('sort', sort);
      params.append('page', String(page));
      params.append('pageSize', '10');

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/api/tickets?${params.toString()}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `HTTP ${res.status}: Failed to fetch tickets.`);
      }

      setTickets(data.tickets || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalTickets(data.pagination.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to server. Please try again.');
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, selectedSystem, selectedPriority, sort, page, token]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return <span className="tkt-pill tkt-pill-priority-high">High</span>;
      case 'MEDIUM':
        return <span className="tkt-pill tkt-pill-priority-medium">Medium</span>;
      default:
        return <span className="tkt-pill tkt-pill-priority-low">Low</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="tkt-pill tkt-pill-status-in-progress">In Progress</span>;
      case 'OPEN':
      case 'NEW':
        return <span className="tkt-pill tkt-pill-status-open">Open</span>;
      case 'WAITING_FOR_REQUESTER':
      case 'PENDING':
        return <span className="tkt-pill tkt-pill-status-pending">Pending</span>;
      case 'RESOLVED':
        return <span className="tkt-pill tkt-pill-status-resolved">Resolved</span>;
      default:
        return <span className="tkt-pill tkt-pill-status-closed">Closed</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 className="tkt-queue-title">My IT Support Tickets</h2>
          <p className="tkt-queue-sub">Track and manage support requests submitted under your account.</p>
        </div>
        <button
          onClick={onCreateNewTicket}
          className="tkt-btn-primary"
          style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}
        >
          <span>➕</span> Create New Ticket
        </button>
      </div>

      {/* Search & Filters Card */}
      <div className="tkt-search-card">
        <form onSubmit={handleSearchSubmit} className="tkt-search-row">
          <div className="tkt-search-input-group">
            <span className="tkt-search-icon">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket number or summary..."
              className="tkt-search-input"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="tkt-btn-filters"
          >
            <span>🎛️</span> Filters
          </button>
          <button
            type="submit"
            className="tkt-btn-primary"
            style={{ width: 'auto', padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
          >
            Search
          </button>
        </form>

        {showFilters && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
            <div>
              <label className="tkt-label" style={{ fontSize: '0.75rem' }}>Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                className="tkt-input"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="tkt-label" style={{ fontSize: '0.75rem' }}>Related System</label>
              <select
                value={selectedSystem}
                onChange={(e) => { setSelectedSystem(e.target.value); setPage(1); }}
                className="tkt-input"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
              >
                <option value="">All Systems</option>
                {relatedSystems.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="tkt-label" style={{ fontSize: '0.75rem' }}>Priority</label>
              <select
                value={selectedPriority}
                onChange={(e) => { setSelectedPriority(e.target.value); setPage(1); }}
                className="tkt-input"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="tkt-label" style={{ fontSize: '0.75rem' }}>Sort By</label>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="tkt-input"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
              >
                <option value="updatedAt_desc">Last Updated (Newest)</option>
                <option value="createdAt_desc">Created Date (Newest)</option>
                <option value="createdAt_asc">Created Date (Oldest)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Subtitle Count */}
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem', fontWeight: 500 }}>
        Showing {tickets.length > 0 ? (page - 1) * 10 + 1 : 0} to{' '}
        {Math.min(page * 10, totalTickets)} of {totalTickets} tickets
      </div>

      {/* Content Area */}
      {error && (
        <div role="alert" className="tkt-alert-error" style={{ marginBottom: '1.25rem' }}>
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {isLoading ? (
        <div style={{ background: '#ffffff', padding: '3rem', textAlign: 'center', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '4px solid #005a36', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>Loading tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div style={{ background: '#ffffff', padding: '3rem', textAlign: 'center', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '2.5rem' }}>📭</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0 0.25rem 0', color: '#0f172a' }}>No Tickets Found</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>You have not submitted any support tickets matching these criteria.</p>
        </div>
      ) : (
        <div className="tkt-table-container">
          <table className="tkt-table">
            <thead>
              <tr>
                <th>Ticket No. <span className="sort-arrow">⇅</span></th>
                <th>Created Date <span className="sort-arrow">⇅</span></th>
                <th>Summary</th>
                <th>Category <span className="sort-arrow">⇅</span></th>
                <th>Req. Priority</th>
                <th>IT Priority</th>
                <th>Status <span className="sort-arrow">⇅</span></th>
                <th>Owner <span className="sort-arrow">⇅</span></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span
                      onClick={() => onSelectTicket(t.id)}
                      className="tkt-ticket-link"
                    >
                      {t.ticketNumber}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.8rem' }}>
                    {formatDate(t.createdAt)}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a', maxWidth: '300px' }}>
                    {t.summary}
                  </td>
                  <td style={{ color: '#475569' }}>
                    {t.category?.name || 'General'}
                  </td>
                  <td>{getPriorityBadge(t.requestedPriority)}</td>
                  <td>{getPriorityBadge(t.itPriority || t.requestedPriority)}</td>
                  <td>{getStatusBadge(t.currentStatus)}</td>
                  <td style={{ color: '#475569', fontSize: '0.8rem' }}>
                    {t.owner ? t.owner.name : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="tkt-pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="tkt-page-btn"
              >
                &lt; Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`tkt-page-btn ${p === page ? 'active' : ''}`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="tkt-page-btn"
              >
                Next &gt;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
