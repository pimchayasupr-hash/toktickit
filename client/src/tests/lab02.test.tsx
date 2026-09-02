import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('Feature 1: Development Requester Context UI Tests', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();

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
        if (url.includes('/api/tickets')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                tickets: [],
                pagination: { total: 0, page: 1, pageSize: 10, totalPages: 1 },
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        if (url.includes('/api/categories')) {
          return Promise.resolve(
            new Response(JSON.stringify([{ id: 1, name: 'Account and Access' }]), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }
        if (url.includes('/api/related-systems')) {
          return Promise.resolve(
            new Response(JSON.stringify({ relatedSystems: [{ id: 1, name: 'Email' }] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
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

  it('allows choosing a requester and continuing to active context', async () => {
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
        expect(screen.getByText(/My Support Tickets/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Jennifer Anderson/i).length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
  });

  it('allows changing requester identity via navbar button', async () => {
    sessionStorage.setItem('X-Development-Requester-Id', '1');
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/My Support Tickets/i)).toBeInTheDocument();
    });

    const changeBtn = screen.getByRole('button', { name: /Change Requester/i });
    await user.click(changeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Development Requester Selection/i)).toBeInTheDocument();
    });

    expect(sessionStorage.getItem('X-Development-Requester-Id')).toBeNull();
  });
});
