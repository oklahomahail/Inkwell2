import React from 'react';

import { useToast } from '@/context/toast';

export type ToastContainerProps = {
  className?: string;
};

export function _ToastContainer({ className = '' }: ToastContainerProps) {
  const { toasts, removeToast } = useToast();

  return (
    <div className={['fixed top-4 right-4 z-50 space-y-2', className].filter(Boolean).join(' ')}>
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={[
            'min-w-[220px] rounded-lg px-3 py-2 text-sm shadow backdrop-blur border text-left',
            t.type === 'success' && 'bg-green-600/90 text-white border-green-500',
            t.type === 'error' && 'bg-red-600/90 text-white border-red-500',
            t.type === 'warning' && 'bg-yellow-500/90 text-black border-yellow-400',
            t.type === 'info' && 'bg-slate-800/90 text-white border-slate-600',
          ]
            .filter(Boolean)
            .join(' ')}
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
