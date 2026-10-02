import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserManagement } from '../../components/admin/UserManagement';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 3 UI - UserManagement Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({ users: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('UI-06: User Management renders title and Create New User button', async () => {
    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/User Management/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Create New User/i })).toBeDefined();
      expect(screen.getByPlaceholderText(/Search users by name or email/i)).toBeDefined();
    });
  });

  it('UI-06b: Pressing Escape closes open modal in User Management', async () => {
    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    // Click Create New User
    const createBtn = await screen.findByRole('button', { name: /Create New User/i });
    createBtn.click();

    expect(await screen.findByText(/Create New User Account/i)).toBeDefined();

    // Fire Escape key
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.queryByText(/Create New User Account/i)).toBeNull();
    });
  });
});
