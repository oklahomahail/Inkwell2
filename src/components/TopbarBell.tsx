import { Bell } from 'lucide-react';
import { useState } from 'react';

export default function TopbarBell() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Notifications"
        onClick={() => setOpen(true)}
        className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 bg-black/30 flex items-start justify-center pt-32 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Notifications</h3>
            <p className="text-sm text-gray-600 mb-4">Nothing new yet.</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
