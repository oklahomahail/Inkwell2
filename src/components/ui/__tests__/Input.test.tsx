/**
 * Input Component Tests
 *
 * Tests for the accessible Input component with label, error, and hint support
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Input } from '../Input';

describe('Input', () => {
  it('renders basic input', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email" placeholder="email@example.com" />);

    const label = screen.getByText('Email');
    expect(label).toBeInTheDocument();

    const input = screen.getByPlaceholderText('email@example.com');
    expect(input).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(<Input label="Username" required />);

    const requiredStar = screen.getByText('*');
    expect(requiredStar).toBeInTheDocument();
    expect(requiredStar).toHaveClass('text-red-500');
  });

  it('renders with hint text', () => {
    render(<Input label="Password" hint="Must be at least 8 characters" />);

    const hint = screen.getByText('Must be at least 8 characters');
    expect(hint).toBeInTheDocument();
    expect(hint).toHaveClass('text-gray-500');
  });

  it('renders with error message', () => {
    render(<Input label="Email" error="Invalid email format" />);

    const error = screen.getByText('Invalid email format');
    expect(error).toBeInTheDocument();
    expect(error).toHaveClass('text-red-600');
  });

  it('hides hint when error is present', () => {
    render(<Input label="Email" hint="Enter your email" error="Invalid format" />);

    // Error should be visible
    expect(screen.getByText('Invalid format')).toBeInTheDocument();

    // Hint should not be visible
    expect(screen.queryByText('Enter your email')).not.toBeInTheDocument();
  });

  it('applies error styling when error is present', () => {
    render(<Input error="Error message" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('border-red-300');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Input ref={ref as any} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('uses provided id', () => {
    render(<Input id="custom-id" label="Test" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'custom-id');

    const label = screen.getByText('Test');
    expect(label).toHaveAttribute('for', 'custom-id');
  });

  it('generates id from name when id not provided', () => {
    render(<Input name="username" label="Username" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'username');

    const label = screen.getByText('Username');
    expect(label).toHaveAttribute('for', 'username');
  });

  it('associates hint with input via aria-describedby', () => {
    render(<Input id="test-input" hint="Helpful hint" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'test-input-hint');
  });

  it('associates error with input via aria-describedby', () => {
    render(<Input id="test-input" error="Error message" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'test-input-error');
  });

  it('passes through standard input props', () => {
    render(
      <Input type="email" placeholder="email@example.com" disabled data-testid="test-input" />,
    );

    const input = screen.getByPlaceholderText('email@example.com');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('data-testid', 'test-input');
  });
});
