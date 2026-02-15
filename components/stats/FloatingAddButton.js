'use client';

import { useState } from 'react';
import StatEntryModal from './StatEntryModal';

/**
 * Floating "+" button — visible on all authenticated pages.
 * Opens the stat entry modal on click.
 */
export default function FloatingAddButton({ sportProfiles }) {
  const [open, setOpen] = useState(false);

  if (!sportProfiles || sportProfiles.length === 0) return null;

  return (
    <>
      {/* Floating action button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-accent text-black
          shadow-lg shadow-accent/30
          flex items-center justify-center
          hover:scale-110 hover:shadow-xl hover:shadow-accent/40
          active:scale-95
          transition-all duration-200
        "
        aria-label="Add stat entry"
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <StatEntryModal
          sportProfiles={sportProfiles}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
