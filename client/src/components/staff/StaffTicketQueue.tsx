import React, { useState, useEffect } from 'react';
import type { Ticket, Pagination, Category, User } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface StaffTicketQueueProps {
  onSelectTicket: (ticketId: number) => void;
  initialFilter?: { filter?: string; status?: string; priority?: string } | null;
}

export const StaffTicketQueue: React.FC<StaffTicketQueueProps> = ({ onSelectTicket, initialFilter }) => {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(
    initialFilter?.status || (initialFilter?.filter ? 'ACTIVE_OPEN' : '')
  );
  const [priorityFilter, setPriorityFilter] = useState(
    initialFilter?.priority || (initialFilter?.filter === 'urgent' ? 'URGENT' : '')
  );
  const [categoryFilter, setCategoryFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState(
    initialFilter?.filter === 'unassigned'
      ? 'unassigned'
      : initialFilter?.filter === 'mine' && user?.id
      ? String(user.id)
      : ''
  );
  const [sortOrder, setSortOrder] = useState('updatedAt_desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(Boolean(initialFilter));

  // Reference data
  const [categories, setCategories] = useState<Category[]>([]);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchQueue = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (submittedSearch) params.append('search', submittedSearch);
        if (statusFilter) params.append('status', statusFilter);
        if (priorityFilter) params.append('priority', priorityFilter);
        if (categoryFilter) params.append('categoryId', categoryFilter);
        if (ownerFilter) params.append('ownerId', ownerFilter);
        if (sortOrder) params.append('sort', sortOrder);
        params.append('page', String(page));
        params.append('pageSize', '10');

        const res = await fetch(`/api/staff/tickets?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 403) {
          throw new Error('403 Forbidden: Access denied. Only IT Staff and Administrators are permitted to access /api/staff/tickets (Role Isolation Guard BR-08).');
        }
        if (!res.ok) {
          throw new Error('Failed to fetch ticket queue.');
        }

        const data = await res.json();
        if (!ignore) {
          setTickets(data.tickets || []);
          setPagination(data.pagination || { page: 1, pageSize: 10, total: 0, totalPages: 1 });
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || 'An error occurred while loading tickets.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchQueue();

    return () => {
      ignore = true;
    };
  }, [page, statusFilter, priorityFilter, categoryFilter, ownerFilter, sortOrder, submittedSearch, token]);

  const fetchReferenceData = async () => {
    try {
      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : catData.categories || []);
      }

      const usersRes = await fetch('/api/staff/assignees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const userData = await usersRes.json();
        setStaffUsers(userData.assignees || userData.users || []);
      }
    } catch {}
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSubmittedSearch(search);
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
      {/* Title */}
      <div className="tkt-queue-header">
        <h2 className="tkt-queue-title">IT Staff Shared Ticket Queue</h2>
        <p className="tkt-queue-sub">Find, assign, prioritize, and process support tickets across all requesters.</p>
      </div>

      {/* Filter & Search Bar */}
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
            style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
          >
            Search
          </button>
        </form>

        {showFilters && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
            <div>
              <label className="tkt-label" style={{ fontSize: '0.75rem' }}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="tkt-input"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE_OPEN">Active Open (Non-Terminal)</option>
                <option value="NEW">New</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
                <option value="REOPENED">Reopened</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="tkt-label" style={{ fontSize: '0.75rem' }}>Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
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
              <label className="tkt-label" style={{ fontSize: '0.75rem' }}>Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
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
              <label className="tkt-label" style={{ fontSize: '0.75rem' }}>Owner</label>
              <select
                value={ownerFilter}
                onChange={(e) => { setOwnerFilter(e.target.value); setPage(1); }}
                className="tkt-input"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
              >
                <option value="">All Owners</option>
                <option value="unassigned">Unassigned</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="tkt-label" style={{ fontSize: '0.75rem' }}>Sort By</label>
              <select
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
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
          {Math.min(page * 10, pagination.total)} of {pagination.total} tickets
        </div>
        {(ownerFilter || statusFilter || priorityFilter || categoryFilter) && (
          <div
            data-testid="active-staff-drilldown-filter"
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
            <span>
              Filtered View:{' '}
              {ownerFilter === 'unassigned'
                ? 'Unassigned Queue'
                : ownerFilter
                ? 'My Assigned Queue'
                : statusFilter
                ? `Status = ${statusFilter}`
                : priorityFilter
                ? `Priority = ${priorityFilter}`
                : 'Custom Filter'}
            </span>
            <button
              type="button"
              onClick={() => {
                setOwnerFilter('');
                setStatusFilter('');
                setPriorityFilter('');
                setCategoryFilter('');
                setPage(1);
              }}
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

      {loading ? (
        <div style={{ background: '#ffffff', padding: '3rem', textAlign: 'center', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '4px solid #006B3C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>Loading ticket queue...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div style={{ background: '#ffffff', padding: '3rem', textAlign: 'center', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '48px', height: '48px', margin: '0 auto 0.5rem', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0 0.25rem 0', color: '#0f172a' }}>No Tickets Found</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Try resetting your filters or search terms.</p>
        </div>
      ) : (
        <>
          {/* Mobile View: Stacked Card List (< 768px) */}
          <div className="tkt-card-list tkt-mobile-only" data-testid="mobile-ticket-cards">
            {tickets.map((t) => (
              <div key={t.id} className="tkt-queue-card">
                <div className="tkt-queue-card-header">
                  <span
                    onClick={() => onSelectTicket(t.id)}
                    className="tkt-ticket-link"
                    style={{ fontSize: '0.95rem' }}
                  >
                    {t.ticketNumber}
                  </span>
                  <div>{getStatusBadge(t.currentStatus)}</div>
                </div>
                <div className="tkt-queue-card-title">{t.summary}</div>
                <div className="tkt-queue-card-meta">
                  <div className="tkt-queue-card-meta-item">
                    <span className="tkt-queue-card-meta-label">Category</span>
                    <span style={{ color: '#334155' }}>{t.category?.name || 'General'}</span>
                  </div>
                  <div className="tkt-queue-card-meta-item">
                    <span className="tkt-queue-card-meta-label">Owner</span>
                    <span style={{ color: '#334155' }}>
                      {t.owner ? t.owner.name : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>}
                    </span>
                  </div>
                  <div className="tkt-queue-card-meta-item">
                    <span className="tkt-queue-card-meta-label">Req. Priority</span>
                    <div>{getPriorityBadge(t.requestedPriority)}</div>
                  </div>
                  <div className="tkt-queue-card-meta-item">
                    <span className="tkt-queue-card-meta-label">IT Priority</span>
                    <div>{getPriorityBadge(t.itPriority || t.requestedPriority)}</div>
                  </div>
                </div>
                <button
                  onClick={() => onSelectTicket(t.id)}
                  className="tkt-queue-card-btn"
                >
                  Open Detail
                </button>
              </div>
            ))}
          </div>

          {/* Desktop & Tablet Table (>= 768px) */}
          <div className="tkt-table-container tkt-desktop-tablet">
            <table className="tkt-table">
              <thead>
                <tr>
                  <th>Ticket No. <span className="sort-arrow">⇅</span></th>
                  <th className="tkt-desktop-only">Created Date <span className="sort-arrow">⇅</span></th>
                  <th>Summary</th>
                  <th className="tkt-desktop-only">Category <span className="sort-arrow">⇅</span></th>
                  <th>Req. Priority</th>
                  <th>IT Priority</th>
                  <th>Status <span className="sort-arrow">⇅</span></th>
                  <th>Owner <span className="sort-arrow">⇅</span></th>
                  <th style={{ textAlign: 'right' }}>Action</th>
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
                    <td className="tkt-desktop-only" style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.8rem' }}>
                      {formatDate(t.createdAt)}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a', maxWidth: '300px' }}>
                      {t.summary}
                    </td>
                    <td className="tkt-desktop-only" style={{ color: '#475569' }}>
                      {t.category?.name || 'General'}
                    </td>
                    <td>{getPriorityBadge(t.requestedPriority)}</td>
                    <td>{getPriorityBadge(t.itPriority || t.requestedPriority)}</td>
                    <td>{getStatusBadge(t.currentStatus)}</td>
                    <td style={{ color: '#475569', fontSize: '0.8rem' }}>
                      {t.owner ? t.owner.name : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => onSelectTicket(t.id)}
                        className="tkt-btn-filters"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#EAF6EF', color: '#006B3C', borderColor: '#bbf7d0', minHeight: '36px' }}
                      >
                        Open Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="tkt-pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="tkt-page-btn"
              >
                &lt; Previous
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`tkt-page-btn ${p === page ? 'active' : ''}`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="tkt-page-btn"
              >
                Next &gt;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
