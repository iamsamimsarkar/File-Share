import React from 'react';
import { X, ShieldCheck, Key, Lock, EyeOff } from 'lucide-react';
import { playSlicePop } from '../utils/audio';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={() => {
            playSlicePop();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-amber-600" />
          <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
            Security & Zero-Knowledge Privacy
          </h3>
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-6">
          How FilePizza guarantees your files never leak to third parties or intermediate servers.
        </p>

        <div className="space-y-4 text-xs text-stone-700 dark:text-stone-300">
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-white mb-1.5">
              <Key className="w-4 h-4 text-amber-600" />
              <span>URL Fragment Key Storage</span>
            </div>
            <p className="leading-relaxed text-stone-600 dark:text-stone-400">
              When a room is baked, an AES-256-GCM symmetric key is generated inside your browser using the W3C Web Cryptography API. This key is encoded into the URL fragment after the hash symbol (<code className="px-1 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-mono">#slice=...&key=...</code>). By RFC 3986, web browsers never transmit URI fragments to web servers in HTTP requests.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-white mb-1.5">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Authenticated Encryption (AES-GCM)</span>
            </div>
            <p className="leading-relaxed text-stone-600 dark:text-stone-400">
              Each 64 KB slice of your file is encrypted with a unique 12-byte initialization vector (IV) and authenticated with a Galois Message Authentication Code. Any tampering in transit causes instant cryptographic rejection.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-white mb-1.5">
              <EyeOff className="w-4 h-4 text-amber-600" />
              <span>Zero-Logs & No Disk Writes</span>
            </div>
            <p className="leading-relaxed text-stone-600 dark:text-stone-400">
              The signaling server coordinates only network connection handshakes (ICE candidates and SDP offers). Slices are streamed straight from sender RAM/disk to receiver RAM/disk without touching any intermediary storage.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => {
              playSlicePop();
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
