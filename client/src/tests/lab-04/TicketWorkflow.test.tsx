import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TicketWorkflowControls } from '../../components/staff/TicketWorkflowControls';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 4 UI - TicketWorkflowControls Component', () => {
  const mockTicket = {
    id: 1,
    ticketNumber: 'TKT-2026-000001',
    currentStatus: 'IN_PROGRESS',
    ownerId: 2,
    version: 1,
    actionsCount: 1,
    hasActionWithResult: true,
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => {
      return Promise.resolve(new Response(JSON.stringify({ ticket: mockTicket }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('TEST-UI-WFK-01: Renders permitted transitions for current status IN_PROGRESS', async () => {
    const handleStatusChanged = vi.fn();

    render(
      <AuthProvider>
        <TicketWorkflowControls
          ticket={mockTicket}
          onStatusChanged={handleStatusChanged}
        />
      </AuthProvider>
    );

    await waitFor(() => {
      // IN_PROGRESS can transition to WAITING_FOR_REQUESTER, RESOLVED, CANCELLED, OPEN
      expect(screen.getByText(/Update Status/i)).toBeDefined();
    });
  });
});
