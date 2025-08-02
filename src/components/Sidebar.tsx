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
    <aside className="h-full w-64 bg-white border-r shadow-sm">
      <nav className="flex flex-col p-4 space-y-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-100'
              )
            }
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
