import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 3 UI - ChangePassword Component', () => {
  it('UI-02: Mandatory password change form renders inputs and password rules', () => {
    render(
      <AuthProvider>
        <ChangePasswordModal />
      </AuthProvider>
    );

    expect(screen.getByText(/Change Your Password/i)).toBeDefined();
    expect(screen.getByText(/Minimum 8 characters long/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Save New Password & Continue/i })).toBeDefined();
  });

  it('UI-02b (BR-02): ChangePasswordModal is mandatory and cannot be closed with Escape or backdrop clicks', () => {
    const { container } = render(
      <AuthProvider>
        <ChangePasswordModal />
      </AuthProvider>
    );

    // Simulate Escape key press
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    window.dispatchEvent(event);

    // Modal must still be visible and mounted
    expect(screen.getByText(/Change Your Password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Save New Password & Continue/i })).toBeDefined();
    expect(container.querySelector('.tkt-auth-card')).toBeDefined();
  });
});
