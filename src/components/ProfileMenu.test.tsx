import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProfileMenu from './ProfileMenu';

describe('ProfileMenu', () => {
  beforeEach(() => {
    // Mock window.InkwellTour
    window.InkwellTour = {
      start: vi.fn(),
      reset: vi.fn(),
      isAvailable: vi.fn(() => true),
    };
  });

  describe('User Display', () => {
    it('displays user name and email', () => {
      render(
        <ProfileMenu user={{ name: 'John Doe', email: 'john@example.com' }} onLogout={vi.fn()} />,
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('shows initials from name when no avatar', () => {
      render(
        <ProfileMenu user={{ name: 'John Doe', email: 'john@example.com' }} onLogout={vi.fn()} />,
      );

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('shows initials from email when no name', () => {
      render(<ProfileMenu user={{ email: 'test@example.com' }} onLogout={vi.fn()} />);

      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('shows question mark when no user info', () => {
      render(<ProfileMenu onLogout={vi.fn()} />);

      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('renders avatar image when avatarUrl is provided', () => {
      render(
        <ProfileMenu
          user={{
            name: 'John Doe',
            email: 'john@example.com',
            avatarUrl: 'https://example.com/avatar.jpg',
          }}
          onLogout={vi.fn()}
        />,
      );

      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('shows default user text when no name provided', () => {
      render(<ProfileMenu user={{ email: 'test@example.com' }} onLogout={vi.fn()} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('shows default email text when no email provided', () => {
      render(<ProfileMenu user={{ name: 'John Doe' }} onLogout={vi.fn()} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('No email')).toBeInTheDocument();
    });
  });

  describe('Menu Items', () => {
    it('always shows Replay Spotlight Tour button', () => {
      render(<ProfileMenu user={{ name: 'John Doe' }} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.getByText('Replay Spotlight Tour')).toBeInTheDocument();
    });

    it('calls tour start when tour button is clicked', () => {
      render(<ProfileMenu user={{ name: 'John Doe' }} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      const tourButton = screen.getByText('Replay Spotlight Tour');
      fireEvent.click(tourButton);

      expect(window.InkwellTour?.start).toHaveBeenCalledWith('spotlight', {
        source: 'profile_menu',
      });
    });

    it('shows Reset Password button when onResetPassword is provided', () => {
      const onResetPassword = vi.fn();

      render(<ProfileMenu user={{ name: 'John Doe' }} onResetPassword={onResetPassword} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.getByText('Reset Password')).toBeInTheDocument();
    });

    it('does not show Reset Password button when onResetPassword is not provided', () => {
      render(<ProfileMenu user={{ name: 'John Doe' }} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.queryByText('Reset Password')).not.toBeInTheDocument();
    });

    it('calls onResetPassword when Reset Password button is clicked', () => {
      const onResetPassword = vi.fn();

      render(<ProfileMenu user={{ name: 'John Doe' }} onResetPassword={onResetPassword} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      const resetButton = screen.getByText('Reset Password');
      fireEvent.click(resetButton);

      expect(onResetPassword).toHaveBeenCalledTimes(1);
    });

    it('shows Log Out button when onLogout is provided', () => {
      const onLogout = vi.fn();

      render(<ProfileMenu user={{ name: 'John Doe' }} onLogout={onLogout} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.getByText('Log Out')).toBeInTheDocument();
    });

    it('does not show Log Out button when onLogout is not provided', () => {
      render(<ProfileMenu user={{ name: 'John Doe' }} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.queryByText('Log Out')).not.toBeInTheDocument();
    });

    it('calls onLogout when Log Out button is clicked', () => {
      const onLogout = vi.fn();

      render(<ProfileMenu user={{ name: 'John Doe' }} onLogout={onLogout} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      const logoutButton = screen.getByText('Log Out');
      fireEvent.click(logoutButton);

      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it('shows all menu items when all handlers are provided', () => {
      const onLogout = vi.fn();
      const onResetPassword = vi.fn();

      render(
        <ProfileMenu
          user={{ name: 'John Doe' }}
          onLogout={onLogout}
          onResetPassword={onResetPassword}
        />,
      );

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      expect(screen.getByText('Replay Spotlight Tour')).toBeInTheDocument();
      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.getByText('Log Out')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <ProfileMenu user={{ name: 'John Doe' }} className="custom-class" />,
      );

      const menuContainer = container.querySelector('.custom-class');
      expect(menuContainer).toBeInTheDocument();
    });

    it('shows tour button with keyboard shortcut hint', () => {
      render(<ProfileMenu user={{ name: 'John Doe' }} />);

      const menuButton = screen.getByRole('button');
      fireEvent.click(menuButton);

      const tourButton = screen.getByTitle('Shift + ?');
      expect(tourButton).toBeInTheDocument();
    });
  });

  describe('Initials Generation', () => {
    it('handles single word names', () => {
      render(<ProfileMenu user={{ name: 'Madonna' }} />);
      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('handles multi-word names and takes first two initials', () => {
      render(<ProfileMenu user={{ name: 'Mary Jane Watson Smith' }} />);
      expect(screen.getByText('MJ')).toBeInTheDocument();
    });

    it('handles lowercase names', () => {
      render(<ProfileMenu user={{ name: 'john doe' }} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('handles names with extra spaces', () => {
      render(<ProfileMenu user={{ name: '  John   Doe  ' }} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });
});
