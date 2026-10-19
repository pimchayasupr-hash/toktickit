import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RequesterDashboard } from '../../components/requester/RequesterDashboard';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 4 UI - RequesterDashboard Component', () => {
  const mockRequesterData = {
    metrics: {
      openTicketsCount: 3,
      waitingForRequesterCount: 1,
      recentlyResolvedCount: 2,
      closedTicketsCount: 5,
    },
    attentionTickets: [
      {
        id: 102,
        ticketNumber: 'TKT-2026-000102',
        summary: 'Cannot connect to staging server',
        currentStatus: 'WAITING_FOR_REQUESTER',
        updatedAt: new Date().toISOString(),
      },
    ],
    recentTickets: [
      {
        id: 105,
        ticketNumber: 'TKT-2026-000105',
        summary: 'VPN drops continuously',
        currentStatus: 'IN_PROGRESS',
        requestedPriority: 'HIGH',
        updatedAt: new Date().toISOString(),
      },
    ],
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/dashboard/requester')) {
        return Promise.resolve(new Response(JSON.stringify(mockRequesterData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return Promise.reject(new Error('Unknown endpoint'));
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('TEST-UI-DSH-02: Renders metric cards and attention banner for tickets needing response', async () => {
    const handleNavigate = vi.fn();

    render(
      <AuthProvider>
        <RequesterDashboard onNavigate={handleNavigate} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Open Tickets/i)).toBeDefined();
      expect(screen.getByText(/Waiting for/i)).toBeDefined();
      // Attention alert banner
      expect(screen.getByText(/awaiting your feedback/i)).toBeDefined();
    });
  });
});
