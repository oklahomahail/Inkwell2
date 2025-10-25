// src/components/ProfileMenu.tsx - User account menu for session management
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { ChevronDown, LogOut, KeyRound, HelpCircle } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

interface ProfileMenuProps {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
  onResetPassword?: () => void;
  className?: string;
}

export default function ProfileMenu({
  user,
  onLogout,
  onResetPassword,
  className,
}: ProfileMenuProps) {
  // Generate initials from name
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <Menu as="div" className={cn('relative', className)}>
      <MenuButton className="flex items-center gap-2 rounded-full border border-transparent hover:border-subtle focus:outline-none focus:ring-2 focus:ring-ink-500 transition-colors">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name || 'User'}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-600 text-white text-sm font-medium">
            {initials}
          </div>
        )}
        <ChevronDown className="h-4 w-4 text-text-2" />
      </MenuButton>

      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-subtle bg-white shadow-lg focus:outline-none z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-subtle">
            <p className="text-sm font-medium text-text-1">{user?.name || 'User'}</p>
            <p className="text-xs text-text-2 truncate">{user?.email || 'No email'}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Replay Spotlight Tour */}
            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={() => window.InkwellTour?.start('spotlight', { source: 'profile_menu' })}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm flex items-center gap-2',
                    focus ? 'bg-ink-50 text-ink-700' : 'text-text-1',
                  )}
                  title="Shift + ?"
                >
                  <HelpCircle className="h-4 w-4" />
                  Replay Spotlight Tour
                </button>
              )}
            </MenuItem>

            {onResetPassword && (
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={onResetPassword}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm flex items-center gap-2',
                      focus ? 'bg-ink-50 text-ink-700' : 'text-text-1',
                    )}
                  >
                    <KeyRound className="h-4 w-4" />
                    Reset Password
                  </button>
                )}
              </MenuItem>
            )}

            {onLogout && (
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={onLogout}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm flex items-center gap-2',
                      focus ? 'bg-red-50 text-red-700' : 'text-red-600',
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                )}
              </MenuItem>
            )}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
