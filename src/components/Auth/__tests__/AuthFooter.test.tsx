/**
 * AuthFooter Component Tests
 *
 * Tests for the authentication footer with sign-in/sign-up toggle
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

import AuthFooter from '../AuthFooter';

// Wrapper component for router context
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AuthFooter', () => {
  describe('Sign In Mode', () => {
    it('shows sign up prompt and link when in signin mode', () => {
      renderWithRouter(<AuthFooter mode="signin" />);

      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(screen.getByText('Sign up')).toBeInTheDocument();
    });

    it('links to sign-up page when in signin mode', () => {
      renderWithRouter(<AuthFooter mode="signin" />);

      const link = screen.getByText('Sign up');
      expect(link).toHaveAttribute('href', '/sign-up');
    });

    it('includes redirect parameter when custom redirect is provided', () => {
      renderWithRouter(<AuthFooter mode="signin" redirect="/projects" />);

      const link = screen.getByText('Sign up');
      expect(link).toHaveAttribute('href', '/sign-up?redirect=%2Fprojects');
    });

    it('omits redirect parameter when redirect is default dashboard', () => {
      renderWithRouter(<AuthFooter mode="signin" redirect="/dashboard" />);

      const link = screen.getByText('Sign up');
      expect(link).toHaveAttribute('href', '/sign-up');
      expect(link.getAttribute('href')).not.toContain('redirect');
    });

    it('omits redirect parameter when no redirect prop provided', () => {
      renderWithRouter(<AuthFooter mode="signin" />);

      const link = screen.getByText('Sign up');
      expect(link).toHaveAttribute('href', '/sign-up');
      expect(link.getAttribute('href')).not.toContain('redirect');
    });
  });

  describe('Sign Up Mode', () => {
    it('shows sign in prompt and link when in signup mode', () => {
      renderWithRouter(<AuthFooter mode="signup" />);

      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });

    it('links to sign-in page when in signup mode', () => {
      renderWithRouter(<AuthFooter mode="signup" />);

      const link = screen.getByText('Sign in');
      expect(link).toHaveAttribute('href', '/sign-in');
    });

    it('includes redirect parameter when custom redirect is provided', () => {
      renderWithRouter(<AuthFooter mode="signup" redirect="/writing" />);

      const link = screen.getByText('Sign in');
      expect(link).toHaveAttribute('href', '/sign-in?redirect=%2Fwriting');
    });

    it('omits redirect parameter when redirect is default dashboard', () => {
      renderWithRouter(<AuthFooter mode="signup" redirect="/dashboard" />);

      const link = screen.getByText('Sign in');
      expect(link).toHaveAttribute('href', '/sign-in');
      expect(link.getAttribute('href')).not.toContain('redirect');
    });
  });

  describe('Styling', () => {
    it('applies correct CSS classes to link', () => {
      renderWithRouter(<AuthFooter mode="signin" />);

      const link = screen.getByText('Sign up');
      expect(link).toHaveClass('font-medium', 'underline', 'text-[#13294B]');
    });

    it('renders container with correct layout classes', () => {
      const { container } = renderWithRouter(<AuthFooter mode="signin" />);

      const footer = container.querySelector('.mt-4.text-center.text-sm');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('URL Encoding', () => {
    it('properly encodes special characters in redirect URL', () => {
      renderWithRouter(<AuthFooter mode="signin" redirect="/path?foo=bar&baz=qux" />);

      const link = screen.getByText('Sign up');
      const href = link.getAttribute('href');

      // Should encode the special characters in the redirect parameter
      expect(href).toContain('redirect=');
      expect(href).toContain('%2F'); // Encoded /
      expect(href).toContain('%3F'); // Encoded ?
      expect(href).toContain('%3D'); // Encoded =
      expect(href).toContain('%26'); // Encoded &
    });

    it('handles redirect with hash fragment', () => {
      renderWithRouter(<AuthFooter mode="signup" redirect="/projects#section-1" />);

      const link = screen.getByText('Sign in');
      const href = link.getAttribute('href');

      expect(href).toContain('redirect=');
      expect(href).toContain('%23'); // Encoded #
    });
  });
});
