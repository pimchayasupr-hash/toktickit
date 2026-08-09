import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the heading and check system button initially', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: /TokTickIT IT Service Desk/i }),
    ).toBeInTheDocument();

    const checkButton = screen.getByRole('button', { name: /Check System/i });
    expect(checkButton).toBeInTheDocument();
    expect(checkButton).not.toBeDisabled();
  });

  it('shows loading state while fetching system data', async () => {
    const user = userEvent.setup();

    // Create deferred promises to test in-flight loading state
    let resolveHealth: (value: Response) => void;
    const healthPromise = new Promise<Response>((resolve) => {
      resolveHealth = resolve;
    });

    let resolveCategories: (value: Response) => void;
    const categoriesPromise = new Promise<Response>((resolve) => {
      resolveCategories = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/api/health')) {
          return healthPromise;
        }
        if (url.includes('/api/categories')) {
          return categoriesPromise;
        }
        return Promise.reject(new Error('Unknown endpoint'));
      }),
    );

    render(<App />);

    const checkButton = screen.getByRole('button', { name: /Check System/i });
    await user.click(checkButton);

    // Button should show loading and be disabled
    expect(screen.getByRole('button', { name: /Loading.../i })).toBeDisabled();
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

    // Resolve the promises
    resolveHealth!(
      new Response(JSON.stringify({ status: 'ok', service: 'TokTickIT API' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    resolveCategories!(
      new Response(
        JSON.stringify([
          { id: 1, name: 'Account and Access' },
          { id: 2, name: 'Hardware' },
          { id: 3, name: 'Software' },
          { id: 4, name: 'Network' },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Check System/i })).not.toBeDisabled();
  });

  it('displays Online status and category list on successful API calls', async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/api/health')) {
          return Promise.resolve(
            new Response(JSON.stringify({ status: 'ok', service: 'TokTickIT API' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        }
        if (url.includes('/api/categories')) {
          return Promise.resolve(
            new Response(
              JSON.stringify([
                { id: 1, name: 'Account and Access' },
                { id: 2, name: 'Hardware' },
                { id: 3, name: 'Software' },
                { id: 4, name: 'Network' },
              ]),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              },
            ),
          );
        }
        return Promise.reject(new Error('Unknown endpoint'));
      }),
    );

    render(<App />);

    const checkButton = screen.getByRole('button', { name: /Check System/i });
    await user.click(checkButton);

    await waitFor(() => {
      expect(screen.getByTestId('system-status-badge')).toHaveTextContent('Online');
    });

    expect(screen.getByText('TokTickIT API')).toBeInTheDocument();
    expect(screen.getByText('Supported Request Categories')).toBeInTheDocument();

    expect(screen.getByText('Account and Access')).toBeInTheDocument();
    expect(screen.getByText('Hardware')).toBeInTheDocument();
    expect(screen.getByText('Software')).toBeInTheDocument();
    expect(screen.getByText('Network')).toBeInTheDocument();
  });

  it('displays Offline status and useful error message when API fails', async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('Network connection refused'))),
    );

    render(<App />);

    const checkButton = screen.getByRole('button', { name: /Check System/i });
    await user.click(checkButton);

    await waitFor(() => {
      expect(screen.getByTestId('system-status-badge')).toHaveTextContent('Offline');
    });

    const errorAlert = screen.getByTestId('error-alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent(/Offline/i);
    expect(errorAlert).toHaveTextContent(/Network connection refused/i);

    expect(screen.queryByTestId('categories-section')).not.toBeInTheDocument();
  });
});
