import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 3 UI - ChangePassword Component (Modes & Feedback)', () => {
  it('UI-02: Mandatory password change form renders inputs and password rules', () => {
    render(
      <AuthProvider>
        <ChangePasswordModal />
      </AuthProvider>
    );

    expect(screen.getByText(/Change Your Password/i)).toBeDefined();
    expect(screen.getByText(/Minimum 8 characters long/i)).toBeDefined();
    expect(screen.getByText(/Be at least 8 characters/i)).toBeDefined();
    expect(screen.getByText(/Include upper and lower case letters/i)).toBeDefined();
    expect(screen.getByText(/Include a number and a special character/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Update Password & Continue/i })).toBeDefined();
  });

  it('displays validation feedback when new password and confirm password do not match', async () => {
    render(
      <AuthProvider>
        <ChangePasswordModal />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/Current \(temporary\) password/i), { target: { value: 'OldPass123!' } });
    fireEvent.change(screen.getByLabelText(/^New password/i), { target: { value: 'ValidPass123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm new password/i), { target: { value: 'MismatchPass123!' } });

    const form = screen.getByRole('button', { name: /Update Password & Continue/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/do not match/i)).toBeDefined();
    });
  });

  it('displays validation feedback when password is shorter than 8 characters', async () => {
    render(
      <AuthProvider>
        <ChangePasswordModal />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/Current \(temporary\) password/i), { target: { value: 'OldPass123!' } });
    fireEvent.change(screen.getByLabelText(/^New password/i), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText(/Confirm new password/i), { target: { value: 'short' } });

    const form = screen.getByRole('button', { name: /Update Password & Continue/i }).closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/at least 8 characters long/i)).toBeDefined();
    });
  });

  it('renders submit button in disabled state when submitting', () => {
    render(
      <AuthProvider>
        <ChangePasswordModal />
      </AuthProvider>
    );

    const submitBtn = screen.getByRole('button', { name: /Update Password & Continue/i }) as HTMLButtonElement;
    expect(submitBtn).toBeDefined();
    expect(submitBtn.textContent).toContain('Update Password & Continue');
  });
});
