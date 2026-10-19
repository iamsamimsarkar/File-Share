import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Download, CheckCircle, ArrowLeft, Shield, Lock, Zap, FileDown, RefreshCw } from 'lucide-react';
import { PizzaGraphic } from './PizzaGraphic';
import { PizzaReceiver, FileMetadata, TransferStats } from '../utils/p2p';
import { importKeyFromBase64, deriveKeyFromPassword } from '../utils/crypto';
import { playOvenBell, playSlicePop } from '../utils/audio';

interface ReceiverViewProps {
  roomId: string;
  keyHash?: string;
  onGoHome: () => void;
}

export const ReceiverView: React.FC<ReceiverViewProps> = ({
  roomId,
  keyHash,
  onGoHome,
}) => {
  const [meta, setMeta] = useState<FileMetadata | null>(null);
  const [stats, setStats] = useState<TransferStats>({
    bytesTransferred: 0,
    totalBytes: 0,
    percentage: 0,
    speedBps: 0,
    etaSeconds: 0,
    chunksCompleted: 0,
    totalChunks: 0,
    peersCount: 0,
    transportType: 'idle',
  });

  const [downloadStarted, setDownloadStarted] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [downloadedBlob, setDownloadedBlob] = useState<Blob | null>(null);
  const [receiverInstance, setReceiverInstance] = useState<PizzaReceiver | null>(null);
  const [statusMessage, setStatusMessage] = useState('Connecting to oven chef...');
  const [password, setPassword] = useState('');
  const [passwordNeeded, setPasswordNeeded] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Initialize connection
  useEffect(() => {
    let receiver: PizzaReceiver | null = null;

    async function init() {
      let cryptoKey: CryptoKey | null = null;
      if (keyHash) {
        try {
          cryptoKey = await importKeyFromBase64(keyHash);
        } catch (e) {
          console.warn('Failed to parse URL key hash', e);
        }
      }

      receiver = new PizzaReceiver(roomId, cryptoKey);

      receiver.onMetaReceived = (metadata) => {
        setMeta(metadata);
        if (metadata.isEncrypted && !cryptoKey) {
          setPasswordNeeded(true);
        }
        setStatusMessage('Pizza order ready to slice!');
      };

      receiver.onStatsUpdate = (newStats) => {
        setStats(newStats);
      };

      receiver.onStatusUpdate = (status) => {
        setStatusMessage(status);
      };

      receiver.onComplete = (blob, completedMeta) => {
        setDownloadComplete(true);
        setDownloadedBlob(blob);
        playOvenBell();

        // Pizza confetti celebration!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#EF4444', '#F59E0B', '#10B981', '#FCD34D'],
        });

        // Trigger automatic file download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = completedMeta.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      await receiver.connect();
      setReceiverInstance(receiver);
    }

    init();

    return () => {
      receiver?.destroy();
    };
  }, [roomId, keyHash]);

  const handleStartDownload = () => {
    if (!receiverInstance) return;
    playSlicePop();
    setDownloadStarted(true);
    setStatusMessage('Baking and receiving slices...');
    receiverInstance.startDownload();
  };

  const handleUnlockWithPassword = async () => {
    if (!receiverInstance || !password) return;
    setIsDecrypting(true);
    try {
      const salt = new TextEncoder().encode(roomId);
      const derivedKey = await deriveKeyFromPassword(password, salt);
      receiverInstance.setCryptoKey(derivedKey);
      setPasswordNeeded(false);
      playSlicePop();
    } catch (e) {
      alert('Invalid passphrase');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleSaveAgain = () => {
    if (!downloadedBlob || !meta) return;
    playSlicePop();
    const url = URL.createObjectURL(downloadedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = meta.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
      {/* Top back button */}
      <div className="w-full mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            playSlicePop();
            onGoHome();
          }}
          className="inline-flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Send a file instead</span>
        </button>

        <span className="text-xs font-mono text-stone-500">
          Room: <span className="text-amber-700 dark:text-amber-400 font-semibold">{roomId}</span>
        </span>
      </div>

      {/* Main Delivery Box */}
      <div className="w-full bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden">
        {/* Big Pizza Graphic */}
        <div className="my-2">
          <PizzaGraphic
            percentage={downloadComplete ? 100 : stats.percentage}
            recipeId={meta?.recipeId || 'pepperoni-classic'}
            isBaking={downloadStarted && !downloadComplete}
            size={260}
          />
        </div>

        {/* File Meta Headline */}
        <div className="mt-4 mb-6 space-y-1 max-w-md">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900 dark:text-white truncate">
            {meta?.name || 'Waiting for pizza chef...'}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {meta ? (
              <>
                <span>{formatBytes(meta.size)}</span>
                <span className="mx-2">·</span>
                <span>{meta.isEncrypted ? 'End-to-End Encrypted' : 'Peer-to-Peer Transfer'}</span>
              </>
            ) : (
              <span>Connecting directly to sender...</span>
            )}
          </p>
        </div>

        {/* Password Prompt if required */}
        {passwordNeeded && (
          <div className="w-full max-w-md mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
            <div className="flex items-center justify-center gap-2 mb-2 text-xs font-bold text-amber-900 dark:text-amber-300">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Passcode Required to Unlock Pizza</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter pizza passphrase..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleUnlockWithPassword}
                disabled={!password || isDecrypting}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 transition-colors shadow-xs"
              >
                Unlock
              </button>
            </div>
          </div>
        )}

        {/* Main CTA: Grab a slice (Download) */}
        {!downloadStarted && !downloadComplete && (
          <button
            type="button"
            disabled={!meta || passwordNeeded}
            onClick={handleStartDownload}
            className="w-full max-w-md py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            <span>Grab a Slice (Download)</span>
          </button>
        )}

        {/* Downloading in Progress */}
        {downloadStarted && !downloadComplete && (
          <div className="w-full max-w-md space-y-4">
            <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 text-left">
              <div className="space-y-0.5">
                <p className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">Speed</p>
                <p className="text-sm font-bold font-mono text-stone-900 dark:text-white tabular-nums">
                  {formatSpeed(stats.speedBps)}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">Cooked</p>
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
          </div>
        )}

        {/* Download Complete Celebration */}
        {downloadComplete && (
          <div className="w-full max-w-md space-y-4 animate-in fade-in zoom-in-95">
            <div className="py-3 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center gap-2 text-xs text-emerald-900 dark:text-emerald-300 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Order Complete! Fresh Out of the Oven!</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveAgain}
                className="flex-1 py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-100 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <FileDown className="w-4 h-4" />
                <span>Save to Disk Again</span>
              </button>
              <button
                type="button"
                onClick={onGoHome}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <span>Bake Your Own Pizza</span>
              </button>
            </div>
          </div>
        )}

        {/* Status Line */}
        <div className="mt-4 flex items-center gap-2 text-xs text-stone-500">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>{statusMessage}</span>
        </div>
      </div>
    </div>
  );
};
