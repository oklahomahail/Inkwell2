import React from 'react';

import { useToast } from '@/context/toast';
import { cn } from '@/utils';

export type ToastContainerProps = {
  className?: string;
};

export function _ToastContainer({ className = '' }: ToastContainerProps) {
  const { toasts, removeToast } = useToast();

  return (
    <div className={cn('fixed top-4 right-4 z-50 space-y-2', className)}>
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={cn(
            'min-w-[220px] rounded-lg px-3 py-2 text-sm shadow backdrop-blur border text-left',
            t.type === 'success' && 'bg-green-600/90 text-white border-green-500',
            t.type === 'error' && 'bg-red-600/90 text-white border-red-500',
            t.type === 'warning' && 'bg-yellow-500/90 text-black border-yellow-400',
            t.type === 'info' && 'bg-slate-800/90 text-white border-slate-600',
          )}
          title="Click to dismiss"
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}

export const ToastContainer = _ToastContainer;
export default _ToastContainer;
