import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoginForm } from '../../components/auth/LoginForm';
import { AuthProvider } from '../../context/AuthContext';

describe('Lab 3 UI - Login Component', () => {
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
});
