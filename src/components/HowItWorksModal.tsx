import React from 'react';
import { X, ShieldCheck, Cpu, HardDrive, Wifi } from 'lucide-react';
import { playSlicePop } from '../utils/audio';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
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

        <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white mb-2">
          How FilePizza Works 🍕
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-6">
          Free, peer-to-peer file transfers directly inside your browser. Fresh out of the oven!
        </p>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex gap-3">
            <Cpu className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-stone-900 dark:text-white mb-1">
                Direct WebRTC DataChannel
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Unlike cloud storage services that upload your files to centralized third-party servers, FilePizza establishes a direct peer-to-peer pipe between sender and recipient.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex gap-3">
            <HardDrive className="w-5 h-5 text-stone-700 dark:text-stone-300 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-stone-900 dark:text-white mb-1">
                Zero Cloud Storage
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Your data never resides on a server. It streams directly in 64 KB encrypted chunks from the sender’s RAM/disk into the recipient’s browser.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-stone-700 dark:text-stone-300 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-stone-900 dark:text-white mb-1">
                End-to-End Cryptography
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Encryption keys are embedded in the URL fragment (<code className="px-1 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-[11px] font-mono">#key=...</code>). By web standards, fragments are never transmitted to any web server.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex gap-3">
            <Wifi className="w-5 h-5 text-stone-700 dark:text-stone-300 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-stone-900 dark:text-white mb-1">
                Why Keep the Tab Open?
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Because there is no intermediate file host, the sender’s tab acts as the personal pizza chef. Closing the tab turns off the oven and closes the connection.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex gap-3">
            <Cpu className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-stone-900 dark:text-white mb-1">
                Python Flask Signaling & Fallback Engine
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                The lightweight Python Flask backend coordinates room handshakes, ICE candidates, and SDP negotiation. If strict corporate firewalls block direct NAT traversal, it provides an in-memory ephemeral chunk relay.
              </p>
            </div>
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
            Got it, let's bake!
          </button>
        </div>
      </div>
    </div>
  );
};
