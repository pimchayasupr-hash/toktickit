import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('Feature 1: Requester Authentication Flow (Replaces Dev Selector)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, options?: RequestInit) => {
        if (url.includes('/api/auth/me')) {
          const authHeader = (options?.headers as any)?.Authorization;
          if (authHeader === 'Bearer VALID_TOKEN') {
            return Promise.resolve(
              new Response(
                JSON.stringify({ user: { id: 1, name: 'Jennifer Anderson', email: 'jen@test.com', role: 'REQUESTER', mustChangePassword: false } }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              )
            );
          }
          return Promise.resolve(new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), { status: 401 }));
        }
        if (url.includes('/api/auth/login')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ token: 'VALID_TOKEN', user: { id: 1, name: 'Jennifer Anderson', email: 'jen@test.com', role: 'REQUESTER', mustChangePassword: false } }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }
        if (url.includes('/api/tickets')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ tickets: [], pagination: { total: 0, page: 1, pageSize: 10, totalPages: 1 } }),
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
        return Promise.reject(new Error(`Unknown endpoint: ${url}`));
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders Login screen when no identity is authenticated', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });
  });

  it('allows logging in as a requester and seeing My Support Tickets', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    
    await user.type(emailInput, 'jen@test.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(
      () => {
        expect(screen.getByText(/My IT Support Tickets/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Jennifer Anderson/i).length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
  });

  it('allows logging out via navbar button and returning to login screen', async () => {
    localStorage.setItem('toktickit_token', 'VALID_TOKEN');
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/My IT Support Tickets/i)).toBeInTheDocument();
    });

    const logoutBtn = screen.getByRole('button', { name: /Logout/i });
    await user.click(logoutBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    expect(localStorage.getItem('toktickit_token')).toBeNull();
  });
});
