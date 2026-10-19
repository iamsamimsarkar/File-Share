import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { playSlicePop, setSoundEnabled, isSoundEnabled } from '../utils/audio';

interface HeaderProps {
  onOpenHowItWorks: () => void;
  onOpenSecurity: () => void;
  onOpenRecipes: () => void;
  onOpenFAQ: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHowItWorks,
  onOpenSecurity,
  onOpenRecipes,
  onOpenFAQ,
  onGoHome,
}) => {
  const [soundOn, setSoundOn] = React.useState(true);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playSlicePop();
  };

  return (
    <header className="w-full border-b border-amber-900/10 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => {
            playSlicePop();
            onGoHome();
          }}
          className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-white flex items-center gap-2 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <span className="text-2xl" role="img" aria-label="pizza">🍕</span>
          <span>FilePizza</span>
        </button>

        {/* Zone 2: 4-5 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-600 dark:text-stone-300">
          <button
            type="button"
            onClick={() => {
              playSlicePop();
              onOpenHowItWorks();
            }}
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => {
              playSlicePop();
              onOpenSecurity();
            }}
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Security
          </button>
          <button
            type="button"
            onClick={() => {
              playSlicePop();
              onOpenRecipes();
            }}
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Pizza Recipes
          </button>
          <button
            type="button"
            onClick={() => {
              playSlicePop();
              onOpenFAQ();
            }}
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            FAQ
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundOn ? 'Mute sound effects' : 'Unmute sound effects'}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title={soundOn ? 'Sound effects on' : 'Sound muted'}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
