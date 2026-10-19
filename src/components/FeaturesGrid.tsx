import React from 'react';
import { ShieldCheck, Zap, HardDrive, Wifi } from 'lucide-react';

export const FeaturesGrid: React.FC = () => {
  return (
    <section className="w-full max-w-4xl mx-auto mt-16 px-4">
      <div className="text-center mb-8">
        <h3 className="text-lg md:text-xl font-bold tracking-tight text-stone-900 dark:text-white">
          Why Transfer with FilePizza?
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Half cooked, fresh out of the oven. Your files never touch our servers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-1.5">
              Browser-to-Browser WebRTC
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Files stream directly across a decentralized DataChannel pipe without uploading to a middleman.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/60 text-[11px] text-stone-500">
            <span>Direct P2P bandwidth</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <HardDrive className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-1.5">
              Zero Server Storage
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Nothing is saved to disk or indexed by corporations. Once the browser tab closes, the delivery link vanishes.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/60 text-[11px] text-stone-500">
            <span>Pure RAM-to-RAM streaming</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-1.5">
              Client-Side AES-256
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Symmetric keys stay strictly inside the URL hash fragment and are never sent over HTTP to signaling servers.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/60 text-[11px] text-stone-500">
            <span>Zero-knowledge privacy</span>
          </div>
        </div>
      </div>
    </section>
  );
};
