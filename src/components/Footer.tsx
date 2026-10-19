import React from 'react';

interface FooterProps {
  onOpenHowItWorks: () => void;
  onOpenSecurity: () => void;
  onOpenFAQ: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenHowItWorks,
  onOpenSecurity,
  onOpenFAQ,
}) => {
  return (
    <footer className="w-full border-t border-amber-900/10 dark:border-stone-800 py-8 px-6 mt-16 text-xs text-stone-500">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: copyright & unboxed metadata */}
        <div className="flex flex-wrap items-center gap-2 text-stone-600 dark:text-stone-400">
          <span className="font-semibold text-stone-800 dark:text-stone-200">FilePizza</span>
          <span aria-hidden="true">·</span>
          <span>Free peer-to-peer file transfers in your browser</span>
          <span aria-hidden="true">·</span>
          <span>WebRTC DataChannels</span>
          <span aria-hidden="true">·</span>
          <span>Python Flask Backend</span>
        </div>

        {/* Right: navigation links */}
        <div className="flex items-center gap-4 text-xs font-medium text-stone-600 dark:text-stone-400">
          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Architecture
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onOpenSecurity}
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Zero-Knowledge Security
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onOpenFAQ}
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            FAQ
          </button>
        </div>
      </div>
    </footer>
  );
};
