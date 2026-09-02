import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('Lab 2 Frontend UI Tests', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();

    // Mock fetch for active requesters & reference data
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/api/requesters')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                requesters: [
                  { id: 1, name: 'Jennifer Anderson', email: 'jennifer.anderson@example.com' },
                  { id: 2, name: 'Michael Brown', email: 'michael.brown@example.com' },
                ],
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        if (url.includes('/api/categories')) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                { id: 1, name: 'Account and Access' },
                { id: 2, name: 'Hardware' },
              ]),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        if (url.includes('/api/related-systems')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                relatedSystems: [
                  { id: 1, name: 'Email' },
                  { id: 2, name: 'VPN' },
                ],
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        if (url.includes('/api/tickets')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                tickets: [
                  {
                    id: 101,
                    ticketNumber: 'TKT-2026-000101',
                    summary: 'VPN connection issue',
                    description: 'Unable to connect to VPN from home network.',
                    requestedPriority: 'HIGH',
                    currentStatus: 'NEW',
                    requesterId: 1,
                    categoryId: 1,
                    relatedSystemId: 2,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    category: { id: 1, name: 'Account and Access' },
                    relatedSystem: { id: 2, name: 'VPN' },
                    requester: { id: 1, name: 'Jennifer Anderson', email: 'jennifer.anderson@example.com' },
                    attachments: [],
                  },
                ],
                pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 1 },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        return Promise.reject(new Error(`Unknown endpoint: ${url}`));
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders Development Requester Selection when no identity selected', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Development Requester Selection/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Continue to Application/i })).toBeDisabled();
  });

  it('allows choosing a requester and continuing to My Tickets', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Jennifer Anderson/i })).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox', { name: /Select Active Development Requester/i });
    await user.selectOptions(select, '1');

    const continueBtn = screen.getByRole('button', { name: /Continue to Application/i });
    expect(continueBtn).not.toBeDisabled();
    await user.click(continueBtn);

    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: /My IT Support Tickets/i })).toBeInTheDocument();
        expect(screen.getAllByText('TKT-2026-000101').length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
  });

  it('allows changing requester identity via navbar button', async () => {
    sessionStorage.setItem('X-Development-Requester-Id', '1');
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/My IT Support Tickets/i)).toBeInTheDocument();
    });

    const changeBtn = screen.getByRole('button', { name: /Change Requester/i });
    await user.click(changeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Development Requester Selection/i)).toBeInTheDocument();
    });

    expect(sessionStorage.getItem('X-Development-Requester-Id')).toBeNull();
  });
});
