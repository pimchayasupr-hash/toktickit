import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 3 UI - ChangePasswordModal Mandatory Blocking Enforcement', () => {
  it('cannot be dismissed by pressing Escape key', () => {
    render(
      <AuthProvider>
        <ChangePasswordModal />
      </AuthProvider>
    );

    expect(screen.getByText('Change Your Password')).toBeDefined();

    // Fire Escape key event on document and window
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape', keyCode: 27 });
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape', keyCode: 27 });

    // Modal must remain visible
    expect(screen.getByText('Change Your Password')).toBeDefined();
    expect(screen.getByRole('button', { name: /Update Password & Continue/i })).toBeDefined();
  });

  it('cannot be dismissed by clicking the backdrop overlay', () => {
    const { container } = render(
      <AuthProvider>
        <ChangePasswordModal />
      </AuthProvider>
    );

    expect(screen.getByText('Change Your Password')).toBeDefined();

    // Click the backdrop overlay container
    const backdrop = container.firstChild as HTMLElement;
    expect(backdrop).toBeDefined();
    fireEvent.click(backdrop);

    // Modal must remain visible
    expect(screen.getByText('Change Your Password')).toBeDefined();
  });

  it('does not render any close, cancel, or dismiss button', () => {
    render(
      <AuthProvider>
        <ChangePasswordModal />
      </AuthProvider>
    );

    // Assert absence of close / cancel / dismiss buttons
    const closeBtn = screen.queryByRole('button', { name: /close|cancel|×|dismiss/i });
    expect(closeBtn).toBeNull();
  });
});
