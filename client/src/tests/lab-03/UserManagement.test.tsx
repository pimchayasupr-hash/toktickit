import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UserManagement } from '../../components/admin/UserManagement';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 3 UI - UserManagement Component', () => {
  it('UI-06: User Management renders title and Create New User button', () => {
    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    expect(screen.getByText(/User Management/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Create New User/i })).toBeDefined();
    expect(screen.getByPlaceholderText(/Search users by name or email/i)).toBeDefined();
  });
});
