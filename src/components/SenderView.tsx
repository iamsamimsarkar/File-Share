import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, QrCode, ExternalLink, Users, Zap, Shield, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { PizzaGraphic } from './PizzaGraphic';
import { PizzaSender, TransferStats } from '../utils/p2p';
import { playOvenBell, playSlicePop } from '../utils/audio';

interface SenderViewProps {
  roomId: string;
  file: File;
  cryptoKey: CryptoKey | null;
  keyHash: string;
  recipeId: string;
  onReset: () => void;
}

export const SenderView: React.FC<SenderViewProps> = ({
  roomId,
  file,
  cryptoKey,
  keyHash,
  recipeId,
  onReset,
}) => {
  const [stats, setStats] = useState<TransferStats>({
    bytesTransferred: 0,
    totalBytes: file.size,
    percentage: 0,
    speedBps: 0,
    etaSeconds: 0,
    chunksCompleted: 0,
    totalChunks: Math.ceil(file.size / (64 * 1024)),
    peersCount: 0,
    transportType: 'idle',
  });

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState('Oven heating... Waiting for a peer to grab a slice');
  const [senderInstance, setSenderInstance] = useState<PizzaSender | null>(null);

  // Full share URL with hash key for zero-knowledge end-to-end encryption
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/#slice=${roomId}${keyHash ? `&key=${keyHash}` : ''}`
    : '';

  // Prevent accidental tab closure while transferring
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Your pizza file is currently baking! Leaving will cancel transfers to connected peers.';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Initialize PizzaSender engine
  useEffect(() => {
    const sender = new PizzaSender(roomId, [file], cryptoKey, recipeId);

    sender.onStatsUpdate = (newStats) => {
      setStats(newStats);
      if (newStats.percentage >= 100) {
        playOvenBell();
      }
    };

    sender.onPeerCountUpdate = (count) => {
      setStats((prev) => ({ ...prev, peersCount: count }));
    };

    sender.onStatusUpdate = (msg) => {
      setStatusMessage(msg);
    };

    sender.start();
    setSenderInstance(sender);

    return () => {
      sender.destroy();
    };
  }, [roomId, file, cryptoKey, recipeId]);

  // Generate QR code
  useEffect(() => {
    if (shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1c1917',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [shareUrl]);

  const copyToClipboard = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    playSlicePop();
    setTimeout(() => setCopied(false), 2500);
  };

  const openReceiverInNewTab = () => {
    playSlicePop();
    window.open(shareUrl, '_blank');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatSpeed = (bps: number) => {
    return `${formatBytes(bps)}/s`;
  };

  const formatETA = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* Top action row */}
      <div className="w-full mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            playSlicePop();
            onReset();
          }}
          className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Bake another pizza</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span className="tabular-nums font-semibold text-stone-800 dark:text-stone-200">
              {stats.peersCount} {stats.peersCount === 1 ? 'peer' : 'peers'} connected
            </span>
          </span>
        </div>
      </div>

      {/* Main Pizza Baking Card */}
      <div className="w-full bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden">
        {/* Urgent Tab Reminder Banner */}
        <div className="w-full mb-6 py-2.5 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center gap-2 text-xs text-amber-900 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="font-medium">
            Keep this tab open! File is streamed straight from your browser.
          </span>
        </div>

        {/* Big Pizza Graphic */}
        <div className="my-2">
          <PizzaGraphic
            percentage={stats.percentage}
            recipeId={recipeId}
            isBaking={stats.percentage > 0 && stats.percentage < 100}
            size={260}
          />
        </div>

        {/* File Information */}
        <div className="mt-4 mb-6 space-y-1 max-w-md">
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-stone-900 dark:text-white truncate">
            {file.name}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            <span>{formatBytes(file.size)}</span>
            <span className="mx-2">·</span>
            <span className="font-mono text-amber-700 dark:text-amber-400">{roomId}</span>
          </p>
        </div>

        {/* Shareable Link Bar */}
        <div className="w-full max-w-lg mb-6">
          <div className="flex items-center gap-2 p-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full px-3 py-1.5 text-xs font-mono text-stone-800 dark:text-stone-200 bg-transparent outline-hidden truncate"
            />
            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 transition-colors shrink-0 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowQR(!showQR);
                playSlicePop();
              }}
              title="Show QR Code"
              className="p-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors shrink-0"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* QR Code Modal / Drawer */}
        {showQR && qrDataUrl && (
          <div className="mb-6 p-4 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex flex-col items-center space-y-2 animate-in fade-in zoom-in-95">
            <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Scan with mobile phone to download directly
            </p>
            <div className="p-2 bg-white rounded-xl shadow-xs">
              <img src={qrDataUrl} alt="QR Code" className="w-44 h-44" />
            </div>
            <p className="text-[11px] text-stone-500">
              Point your phone camera to grab a slice
            </p>
          </div>
        )}

        {/* Quick Test In New Tab CTA */}
        <div className="w-full max-w-lg mb-6 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={openReceiverInNewTab}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-xs font-semibold transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Test receiver in new tab</span>
          </button>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="w-full max-w-lg grid grid-cols-3 gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 text-left">
          <div className="space-y-0.5">
            <p className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">Speed</p>
            <p className="text-sm font-bold font-mono text-stone-900 dark:text-white tabular-nums">
              {formatSpeed(stats.speedBps)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">Transferred</p>
            <p className="text-sm font-bold font-mono text-stone-900 dark:text-white tabular-nums">
              {formatBytes(stats.bytesTransferred)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">ETA</p>
            <p className="text-sm font-bold font-mono text-stone-900 dark:text-white tabular-nums">
              {formatETA(stats.etaSeconds)}
            </p>
          </div>
        </div>

        {/* Real-time Status Caption */}
        <div className="mt-4 flex items-center gap-2 text-xs text-stone-500">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>{statusMessage}</span>
        </div>
      </div>
    </div>
  );
};
