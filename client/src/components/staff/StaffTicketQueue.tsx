import React, { useState, useEffect } from 'react';
import type { Ticket, Pagination, Category, User } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface StaffTicketQueueProps {
  onSelectTicket: (ticketId: number) => void;
}

export const StaffTicketQueue: React.FC<StaffTicketQueueProps> = ({ onSelectTicket }) => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('updatedAt_desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

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

      const usersRes = await fetch('/api/admin/users?role=STAFF', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersRes.ok) {
        const userData = await usersRes.json();
        setStaffUsers(userData.users || []);
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
      {/* Title */}
      <div className="tkt-queue-header">
        <h2 className="tkt-queue-title">IT Staff Shared Ticket Queue</h2>
        <p className="tkt-queue-sub">Find, assign, prioritize, and process support tickets across all requesters.</p>
      </div>

      {/* Filter & Search Bar */}
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
                <option value="NEW">New</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
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

      {/* Subtitle Count */}
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem', fontWeight: 500 }}>
        Showing {tickets.length > 0 ? (page - 1) * 10 + 1 : 0} to{' '}
        {Math.min(page * 10, pagination.total)} of {pagination.total} tickets
      </div>

      {/* Content Area */}
      {error && (
        <div role="alert" className="tkt-alert-error" style={{ marginBottom: '1.25rem' }}>
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {loading ? (
        <div style={{ background: '#ffffff', padding: '3rem', textAlign: 'center', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '4px solid #005a36', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>Loading ticket queue...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div style={{ background: '#ffffff', padding: '3rem', textAlign: 'center', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '2.5rem' }}>📭</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0 0.25rem 0', color: '#0f172a' }}>No Tickets Found</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Try resetting your filters or search terms.</p>
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
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => onSelectTicket(t.id)}
                      className="tkt-btn-filters"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#eaf6ef', color: '#005a36', borderColor: '#bbf7d0' }}
                    >
                      Open Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
        </div>
      )}
    </div>
  );
};
