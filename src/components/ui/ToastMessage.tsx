// src/components/ui/ToastMessage.tsx
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import React from 'react';
import { cn } from '@/utils/cn';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessageProps {
  type?: ToastType;
  message: string;
}

export const ToastMessage: React.FC<ToastMessageProps> = ({ type = 'info', message }) => {
  const iconMap = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertCircle,
  };

  const styleMap = {
    success: 'bg-green-100 text-green-800 border-green-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };

  const Icon = iconMap[type];

  return (
    <div
      className={cn('flex items-center gap-2 border-l-4 p-3 rounded-md shadow-sm', styleMap[type])}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
};
