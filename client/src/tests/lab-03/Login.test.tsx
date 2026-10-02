import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from '../../components/auth/LoginForm';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 3 UI - Login Component (Modes & Feedback)', () => {
  it('UI-01: Renders login email and password inputs with submit button', () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/Password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeDefined();
  });

  it('displays validation feedback when submitted with empty fields', async () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const form = screen.getByRole('button', { name: /Sign In/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/Please enter both email address and password/i)).toBeDefined();
    });
  });

  it('displays API error alert when authentication fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email address or password.' }
    }), { status: 401, headers: { 'Content-Type': 'application/json' } }))));

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'WrongPass!' } });
    
    const form = screen.getByRole('button', { name: /Sign In/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/Invalid email address or password/i)).toBeDefined();
    });

    vi.unstubAllGlobals();
  });

  it('toggles password visibility when show password button is clicked', () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByRole('button', { name: 'Show' });
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    const hideBtn = screen.getByRole('button', { name: 'Hide' });
    fireEvent.click(hideBtn);
    expect(passwordInput.type).toBe('password');
  });
});
