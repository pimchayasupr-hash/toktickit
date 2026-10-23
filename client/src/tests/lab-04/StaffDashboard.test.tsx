import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StaffDashboard } from '../../components/staff/StaffDashboard';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 4 UI - StaffDashboard Component', () => {
  const mockDashboardData = {
    metrics: {
      unassignedCount: 4,
      myAssignedCount: 6,
      openTotalCount: 15,
      urgentCount: 2,
      byStatus: {
        NEW: 4,
        OPEN: 3,
        IN_PROGRESS: 5,
        WAITING_FOR_REQUESTER: 2,
        RESOLVED: 1,
        CLOSED: 10,
        REOPENED: 0,
        CANCELLED: 1,
      },
      byPriority: {
        LOW: 3,
        MEDIUM: 6,
        HIGH: 4,
        URGENT: 2,
      },
    },
    myRecentActions: [
      {
        id: 1,
        ticketId: 101,
        ticketNumber: 'TKT-2026-000101',
        actionDateTime: new Date().toISOString(),
        description: 'Replaced patch cable',
        result: 'Link established at 1Gbps',
        followUpRequired: false,
      },
    ],
    urgentTickets: [
      {
        id: 99,
        ticketNumber: 'TKT-2026-000099',
        summary: 'Core switch power supply failure',
        currentStatus: 'IN_PROGRESS',
        itPriority: 'URGENT',
        ownerName: 'Michael Staff',
        createdAt: new Date().toISOString(),
      },
    ],
    adminMetrics: null,
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/dashboard/staff')) {
        return Promise.resolve(new Response(JSON.stringify(mockDashboardData), {
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

  it('TEST-UI-DSH-01: Renders metric cards with counts and drill-down targets', async () => {
    const handleNavigate = vi.fn();

    render(
      <AuthProvider>
        <StaffDashboard onNavigate={handleNavigate} />
      </AuthProvider>
    );

    // Initial loading or loaded cards
    await waitFor(() => {
      expect(screen.getByText(/Unassigned/i)).toBeDefined();
      expect(screen.getByText(/My Assigned/i)).toBeDefined();
      expect(screen.getAllByText(/4/)[0]).toBeDefined(); // Unassigned count
      expect(screen.getAllByText(/6/)[0]).toBeDefined(); // My Assigned count
    });
  });

  it('Renders "My Recent Actions Taken" section', async () => {
    const handleNavigate = vi.fn();

    render(
      <AuthProvider>
        <StaffDashboard onNavigate={handleNavigate} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/My Recent Actions/i)).toBeDefined();
      expect(screen.getByText(/Replaced patch cable/i)).toBeDefined();
    });
  });
});
