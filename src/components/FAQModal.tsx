import React from 'react';
import { X, HelpCircle, ChevronDown } from 'lucide-react';
import { playSlicePop } from '../utils/audio';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQS = [
  {
    q: 'How does FilePizza differ from Google Drive or WeTransfer?',
    a: 'Cloud transfer services upload your entire file to their centralized servers and store it there until the recipient downloads it. FilePizza transfers your file directly from your browser to your recipient’s browser using WebRTC DataChannels. The file is never saved on any server.',
  },
  {
    q: 'Why do I have to keep my browser tab open while sharing?',
    a: 'Because FilePizza is true peer-to-peer! Your browser acts as the host server. If you close your tab or lose internet connection, the direct stream to your peers is terminated.',
  },
  {
    q: 'Is there any file size limit?',
    a: 'No artificial size limits! You can transfer 10 MB or 100 GB. Speed is governed purely by the upload bandwidth of the sender and download bandwidth of the recipient.',
  },
  {
    q: 'Can anyone intercept my file transfer?',
    a: 'All transfers are encrypted end-to-end using WebRTC DTLS/SCTP, augmented with client-side AES-256-GCM. The decryption key exists solely in the URL fragment after the hash (#), which is never transmitted to any web server.',
  },
  {
    q: 'Can multiple people download the same file at once?',
    a: 'Yes! Multiple peers can connect to the same pizza room simultaneously. The sender will stream chunks to all connected peers in parallel.',
  },
  {
    q: 'What if WebRTC peer-to-peer fails across strict corporate firewalls?',
    a: 'FilePizza automatically detects connection state and provides a real-time encrypted fallback stream so downloads never hang even on restrictive cellular or office networks.',
  },
];

export const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose }) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

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
          <HelpCircle className="w-6 h-6 text-amber-600" />
          <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
            Frequently Asked Questions
          </h3>
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-6">
          Everything you need to know about peer-to-peer browser delivery.
        </p>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenIndex(isOpen ? null : idx);
                    playSlicePop();
                  }}
                  className="w-full text-left p-4 flex items-center justify-between gap-4 font-semibold text-xs text-stone-900 dark:text-white hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-stone-600 dark:text-stone-400 leading-relaxed border-t border-stone-100 dark:border-stone-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
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
            Close FAQ
          </button>
        </div>
      </div>
    </div>
  );
};
