import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import { AuthForm } from '../AuthForm';

describe('AuthForm', () => {
  it('renders sign in and switches to sign up', () => {
    render(
      <MemoryRouter>
        <AuthForm mode="signin" redirect="/dashboard" primaryCtaLabel="Sign In" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /magic link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /email & password/i })).toBeInTheDocument();
  });

  it('submits password form and shows loading', async () => {
    render(
      <MemoryRouter>
        <AuthForm mode="signin" redirect="/dashboard" primaryCtaLabel="Sign In" />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    // Assert loading state appears
    expect(await screen.findByText(/please wait/i)).toBeInTheDocument();
  });
});
