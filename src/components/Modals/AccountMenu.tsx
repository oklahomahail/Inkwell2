// src/components/Modals/AccountMenu.tsx
import { User, Settings, LogOut, Crown } from 'lucide-react';
import React from 'react';

import devLog from "@/utils/devLog";

interface AccountMenuProps {
  onClose: () => void;
}

export function AccountMenu({ onClose }: AccountMenuProps) {
  const handleAction = (action: string) => {
    devLog.debug(`Account action: ${action}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="absolute top-16 right-4 w-64 bg-white rounded-xl shadow-lg ring-1 ring-black/5 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* User Info */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-[color:var(--ink-fg-strong)]">Dave Hail</p>
              <p className="text-xs text-[color:var(--ink-fg-muted)]">dave@example.com</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-1">
          <button
            onClick={() => handleAction('upgrade')}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[color:var(--ink-fg)] hover:bg-gray-50"
          >
            <Crown className="w-4 h-4" />
            Upgrade to Pro
          </button>

          <button
            onClick={() => handleAction('settings')}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-[color:var(--ink-fg)] hover:bg-gray-50"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>

          <div className="border-t border-gray-100 my-1" />

          <button
            onClick={() => handleAction('signout')}
            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
