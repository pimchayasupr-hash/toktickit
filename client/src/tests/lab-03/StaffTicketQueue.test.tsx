import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StaffTicketQueue } from '../../components/staff/StaffTicketQueue';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 3 UI - StaffTicketQueue Component (Modes & Feedback)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/categories')) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      if (url.includes('/api/staff/assignees')) {
        return Promise.resolve(new Response(JSON.stringify({ assignees: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return Promise.resolve(new Response(JSON.stringify({
        tickets: [],
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 1 },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UI-03: Renders header, search bar, and search button', async () => {
    const handleSelect = vi.fn();

    render(
      <AuthProvider>
        <StaffTicketQueue onSelectTicket={handleSelect} />
      </AuthProvider>
    );

    expect(screen.getByText(/IT Staff Shared Ticket Queue/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Search by ticket number/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Search/i })).toBeDefined();
  });

  it('displays empty / no-results state when no tickets are returned', async () => {
    const handleSelect = vi.fn();

    render(
      <AuthProvider>
        <StaffTicketQueue onSelectTicket={handleSelect} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No Tickets Found/i)).toBeDefined();
      expect(screen.getByText(/Try resetting your filters or search terms/i)).toBeDefined();
    });
  });

  it('renders ticket records when API returns tickets', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/staff/tickets')) {
        return Promise.resolve(new Response(JSON.stringify({
          tickets: [
            {
              id: 101,
              ticketNumber: 'TKT-2026-001001',
              summary: 'VPN Connection Failure',
              currentStatus: 'IN_PROGRESS',
              requestedPriority: 'HIGH',
              itPriority: 'HIGH',
              createdAt: new Date().toISOString(),
              category: { id: 1, name: 'Network' },
              owner: { id: 2, name: 'Sarah Johnson' },
            },
          ],
          pagination: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }));

    const handleSelect = vi.fn();

    render(
      <AuthProvider>
        <StaffTicketQueue onSelectTicket={handleSelect} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('TKT-2026-001001').length).toBeGreaterThan(0);
      expect(screen.getAllByText('VPN Connection Failure').length).toBeGreaterThan(0);
    });
  });

  it('displays error alert banner when API request fails', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/staff/tickets')) {
        return Promise.resolve(new Response('Server Error', { status: 500 }));
      }
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }));

    const handleSelect = vi.fn();

    render(
      <AuthProvider>
        <StaffTicketQueue onSelectTicket={handleSelect} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch ticket queue/i)).toBeDefined();
    });
  });
});
