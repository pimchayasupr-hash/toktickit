import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StaffTicketDetail } from '../../components/staff/StaffTicketDetail';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 3 UI - StaffTicketDetail Component (Modes & Feedback)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/staff/assignees')) {
        return Promise.resolve(new Response(JSON.stringify({ assignees: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return Promise.resolve(new Response(JSON.stringify({
        ticket: {
          id: 1,
          ticketNumber: 'TKT-2026-000001',
          summary: 'Cannot connect to campus Wi-Fi',
          description: 'Connection drops intermittently throughout the building.',
          currentStatus: 'OPEN',
          requestedPriority: 'HIGH',
          itPriority: 'HIGH',
          createdAt: new Date().toISOString(),
          category: { id: 1, name: 'Network' },
          relatedSystem: { id: 1, name: 'Campus Wi-Fi' },
          requester: { id: 1, name: 'Jennifer Anderson', email: 'jennifer.anderson@example.com' },
          owner: null,
          attachments: [],
          publicComments: [],
          internalNotes: [],
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UI-04: Renders loading state initially', () => {
    const handleBack = vi.fn();

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={1} onBack={handleBack} />
      </AuthProvider>
    );

    expect(screen.getByText(/Loading ticket detail/i)).toBeDefined();
  });

  it('renders ticket details, metadata, and back button when loaded', async () => {
    const handleBack = vi.fn();

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={1} onBack={handleBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('TKT-2026-000001')).toBeDefined();
      expect(screen.getByText(/Cannot connect to campus Wi-Fi/i)).toBeDefined();
      expect(screen.getByText(/Back to Ticket Queue/i)).toBeDefined();
      expect(screen.getByDisplayValue('Jennifer Anderson')).toBeDefined();
    });
  });

  it('renders Claim button when ticket is unassigned', async () => {
    const handleBack = vi.fn();

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={1} onBack={handleBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Claim$/i })).toBeDefined();
    });
  });

  it('displays error feedback when ticket API returns 404 or fails', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/staff/tickets/999')) {
        return Promise.resolve(new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Ticket not found.' } }), { status: 404 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ assignees: [] }), { status: 200 }));
    }));

    const handleBack = vi.fn();

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={999} onBack={handleBack} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load ticket detail/i)).toBeDefined();
    });
  });
});
