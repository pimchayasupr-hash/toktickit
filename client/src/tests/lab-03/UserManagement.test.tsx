import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserManagement } from '../../components/admin/UserManagement';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 3 UI - UserManagement Component (Modes & Feedback)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      users: [
        {
          id: 1,
          name: 'Jennifer Anderson',
          email: 'jennifer.anderson@example.com',
          role: 'REQUESTER',
          isActive: true,
          mustChangePassword: false,
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          email: 'sarah.staff@toktickit.com',
          role: 'STAFF',
          isActive: true,
          mustChangePassword: false,
        },
      ]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))));
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

  it('opens Create New User modal with form controls when clicking Create button', async () => {
    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    const createBtn = await screen.findByRole('button', { name: /Create New User/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText('Create New User Account')).toBeDefined();
      expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
      expect(screen.getByLabelText(/Email Address/i)).toBeDefined();
      expect(screen.getByLabelText(/^Role/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Save User/i })).toBeDefined();
    });
  });

  it('renders user records with role badges and edit actions', async () => {
    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Jennifer Anderson').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Sarah Johnson').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('button', { name: /Edit/i }).length).toBeGreaterThan(0);
    });
  });

  it('displays error feedback when API request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('Server error', { status: 500 }))));

    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch user list/i)).toBeDefined();
    });
  });
});
