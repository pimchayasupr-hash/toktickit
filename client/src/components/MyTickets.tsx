import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Ticket, Category, RelatedSystem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface MyTicketsProps {
  onSelectTicket: (ticketId: number) => void;
  onCreateNewTicket: () => void;
  initialFilter?: { status?: string; label?: string } | null;
}

export const MyTickets: React.FC<MyTicketsProps> = ({ onSelectTicket, onCreateNewTicket, initialFilter }) => {
  const { token } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  // Filter & Search State
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSystem, setSelectedSystem] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter?.status || '');
  const [sort, setSort] = useState<string>('updatedAt_desc');
  const [showFilters, setShowFilters] = useState<boolean>(Boolean(initialFilter));

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

      let fetchedTickets: Ticket[] = data.tickets || [];
      if (selectedStatus === 'OPEN_ACTIVE') {
        fetchedTickets = fetchedTickets.filter((t) =>
          ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED'].includes(t.currentStatus)
        );
      } else if (selectedStatus) {
        fetchedTickets = fetchedTickets.filter((t) => t.currentStatus === selectedStatus);
      }

      setTickets(fetchedTickets);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalTickets(selectedStatus ? fetchedTickets.length : data.pagination.total || 0);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to server. Please try again.');
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, selectedSystem, selectedPriority, selectedStatus, sort, page, token]);

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
        return <span className="tkt-pill tkt-pill-priority-urgent">Urgent</span>;
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
      case 'NEW':
        return <span className="tkt-pill tkt-pill-status-new">New</span>;
      case 'OPEN':
        return <span className="tkt-pill tkt-pill-status-open">Open</span>;
      case 'IN_PROGRESS':
        return <span className="tkt-pill tkt-pill-status-in-progress">In Progress</span>;
      case 'WAITING_FOR_REQUESTER':
        return <span className="tkt-pill tkt-pill-status-waiting">Waiting for Requester</span>;
      case 'PENDING':
        return <span className="tkt-pill tkt-pill-status-pending">Pending</span>;
      case 'RESOLVED':
        return <span className="tkt-pill tkt-pill-status-resolved">Resolved</span>;
      case 'REOPENED':
        return <span className="tkt-pill tkt-pill-status-reopened">Reopened</span>;
      case 'CANCELLED':
        return <span className="tkt-pill tkt-pill-status-cancelled">Cancelled</span>;
      case 'CLOSED':
        return <span className="tkt-pill tkt-pill-status-closed">Closed</span>;
      default:
        return <span className="tkt-pill tkt-pill-status-closed">{status}</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-GB', {
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
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 className="tkt-queue-title">My IT Support Tickets</h2>
          <p className="tkt-queue-sub">Track and manage support requests submitted under your account.</p>
        </div>
        <button
          onClick={onCreateNewTicket}
          className="tkt-btn-primary inline-flex items-center gap-2"
          style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}
        >
          <svg width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Create New Ticket
        </button>
      </div>

      {/* Search & Filters Card */}
      <div className="tkt-search-card">
        <form onSubmit={handleSearchSubmit} className="tkt-search-row">
          <div className="tkt-search-input-group">
            <span className="tkt-search-icon">
              <svg width="16" height="16" className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
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
            className="tkt-btn-filters inline-flex items-center gap-1.5"
          >
            <svg width="16" height="16" className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Filters
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

      {/* Subtitle Count & Active Drill-Down Filter Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
          Showing {tickets.length > 0 ? (page - 1) * 10 + 1 : 0} to{' '}
          {Math.min(page * 10, totalTickets)} of {totalTickets} tickets
        </div>
        {selectedStatus && (
          <div
            data-testid="active-drilldown-filter"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              color: '#006B3C',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
            }}
          >
            <span>Filtered by Status: {initialFilter?.label || selectedStatus}</span>
            <button
              type="button"
              onClick={() => setSelectedStatus('')}
              style={{ background: 'none', border: 'none', color: '#006B3C', fontWeight: 800, cursor: 'pointer', padding: 0 }}
            >
              ✕ Clear
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      {error && (
        <div role="alert" className="tkt-alert-error" style={{ marginBottom: '1.25rem' }}>
          <svg width="20" height="20" className="w-5 h-5 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>{error}</div>
        </div>
      )}

      {isLoading ? (
        <div style={{ background: '#ffffff', padding: '3rem', textAlign: 'center', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '4px solid #006B3C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>Loading tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div style={{ background: '#ffffff', padding: '3rem', textAlign: 'center', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '48px', height: '48px', margin: '0 auto 0.5rem', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
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
          {totalPages >= 1 && (
            <div className="tkt-pagination" data-testid="my-tickets-pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="tkt-page-btn"
              >
                &lt; Previous
              </button>
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((p) => (
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
