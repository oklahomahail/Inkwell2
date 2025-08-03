// src/components/Sidebar.tsx
import React from 'react';
import { Home, Book, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/chapters', label: 'Chapters', icon: Book },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="h-full w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 font-semibold text-gray-900 text-lg font-medium">
        App Menu
      </div>
      <nav className="p-4 flex-1 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 text-sm text-gray-600 font-medium rounded-md w-full text-left transition',
                isActive
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  : 'text-gray-700 hover:bg-gray-100',
              )
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
