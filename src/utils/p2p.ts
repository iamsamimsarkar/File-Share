/**
 * Robust Multi-Transport Peer-to-Peer Engine for FilePizza
 * Supports:
 * 1. BroadcastChannel (immediate zero-latency multi-tab transfers)
 * 2. WebRTC DataChannel (direct browser-to-browser P2P with Google STUN)
 * 3. Ephemeral Server Relay (fallback if strict NAT blocks direct P2P)
 */

import { encryptChunk, decryptChunk, exportKeyToBase64 } from './crypto';

export const CHUNK_SIZE = 64 * 1024; // 64 KB chunks

export interface FileMetadata {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  totalChunks: number;
  chunkSize: number;
  sha256?: string;
  isEncrypted: boolean;
  salt?: string;
  recipeId?: string;
}

export interface TransferStats {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  speedBps: number;
  etaSeconds: number;
  chunksCompleted: number;
  totalChunks: number;
  peersCount: number;
  transportType: 'webrtc' | 'broadcast-channel' | 'relay' | 'idle';
}

export type ProgressCallback = (stats: TransferStats) => void;
export type CompleteCallback = (fileBlob: Blob, meta: FileMetadata) => void;
export type PeerCountCallback = (count: number) => void;
export type StatusCallback = (status: string, transport: 'webrtc' | 'broadcast-channel' | 'relay') => void;

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

/**
 * SENDER CLASS: Hosts the pizza room and delivers file slices to connected peers.
 */
export class PizzaSender {
  private roomId: string;
  private peerId: string;
  private files: File[];
  private currentFile: File | null = null;
  private cryptoKey: CryptoKey | null = null;
  private meta: FileMetadata | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private dataChannels = new Map<string, RTCDataChannel>();
  private pollInterval: any = null;
  private lastSignalTimestamp = 0;
  private isDestroyed = false;
  private activePeers = new Set<string>();

  // Callbacks
  public onStatsUpdate?: ProgressCallback;
  public onPeerCountUpdate?: PeerCountCallback;
  public onStatusUpdate?: StatusCallback;

  // Stats
  private totalBytesSent = 0;
  private lastSpeedCheckTime = Date.now();
  private lastSpeedCheckBytes = 0;
  private currentSpeedBps = 0;

  constructor(roomId: string, files: File[], cryptoKey: CryptoKey | null, recipeId?: string) {
    this.roomId = roomId;
    this.peerId = 'sender-' + Math.random().toString(36).substring(2, 9);
    this.files = files;
    this.currentFile = files[0] || null;
    this.cryptoKey = cryptoKey;

    if (this.currentFile) {
      const totalChunks = Math.ceil(this.currentFile.size / CHUNK_SIZE);
      this.meta = {
        fileId: 'file-' + Math.random().toString(36).substring(2, 8),
        name: this.currentFile.name,
        size: this.currentFile.size,
        mimeType: this.currentFile.type || 'application/octet-stream',
        totalChunks,
        chunkSize: CHUNK_SIZE,
        isEncrypted: !!cryptoKey,
        recipeId: recipeId || 'pepperoni-classic',
      };
    }
  }

  public async start() {
    if (!this.meta) return;

    // 1. Initialize BroadcastChannel for instant local testing
    try {
      this.broadcastChannel = new BroadcastChannel(`filepizza-${this.roomId}`);
      this.broadcastChannel.onmessage = (event) => this.handleBroadcastMessage(event.data);
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    // 2. Register room on signaling server
    try {
      await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.roomId,
          hostId: this.peerId,
          meta: this.meta,
        }),
      });
    } catch (e) {
      console.warn('Signaling server registration notice:', e);
    }

    // 3. Start polling for incoming WebRTC signaling messages
    this.startSignalingPoll();

    // 4. Periodically broadcast presence on BroadcastChannel
    const bcInterval = setInterval(() => {
      if (this.isDestroyed) {
        clearInterval(bcInterval);
        return;
      }
      this.broadcastChannel?.postMessage({
        type: 'host-presence',
        senderId: this.peerId,
        meta: this.meta,
      });
    }, 2000);
  }

  private handleBroadcastMessage(data: any) {
    if (!data || data.senderId === this.peerId) return;

    if (data.type === 'peer-ready') {
      const peerId = data.senderId;
      this.activePeers.add(peerId);
      this.onPeerCountUpdate?.(this.activePeers.size);
      this.onStatusUpdate?.('Connected to peer via direct channel', 'broadcast-channel');

      // Send metadata immediately
      this.broadcastChannel?.postMessage({
        type: 'meta',
        senderId: this.peerId,
        targetId: peerId,
        meta: this.meta,
      });
    } else if (data.type === 'request-chunk') {
      this.serveChunkViaBroadcast(data.chunkIndex, data.senderId);
    }
  }

  private async serveChunkViaBroadcast(chunkIndex: number, targetId: string) {
    if (!this.currentFile || !this.meta) return;

    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, this.currentFile.size);
    const slice = this.currentFile.slice(start, end);
    const arrayBuffer = await slice.arrayBuffer();

    let payloadBuffer = arrayBuffer;
    if (this.cryptoKey) {
      payloadBuffer = await encryptChunk(arrayBuffer, this.cryptoKey);
    }

    this.totalBytesSent += end - start;
    this.updateStats('broadcast-channel', chunkIndex + 1, this.meta.totalChunks);

    this.broadcastChannel?.postMessage({
      type: 'chunk-data',
      senderId: this.peerId,
      targetId,
      chunkIndex,
      data: payloadBuffer,
    });
  }

  private startSignalingPoll() {
    this.pollInterval = setInterval(async () => {
      if (this.isDestroyed) return;
      try {
        const res = await fetch(
          `/api/rooms/${this.roomId}/signals?peerId=${this.peerId}&since=${this.lastSignalTimestamp}`
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.signals && data.signals.length > 0) {
          for (const signal of data.signals) {
            this.lastSignalTimestamp = Math.max(this.lastSignalTimestamp, signal.timestamp);
            this.handleSignal(signal);
          }
        }
      } catch (e) {
        // network glitch
      }
    }, 1200);
  }

  private async handleSignal(signal: any) {
    const { senderId, type, payload } = signal;

    if (type === 'join' || type === 'peer-ready') {
      this.activePeers.add(senderId);
      this.onPeerCountUpdate?.(this.activePeers.size);
      // Initiate WebRTC offer to new peer
      this.initiateWebRTCConnection(senderId);
    } else if (type === 'answer') {
      const pc = this.peerConnections.get(senderId);
      if (pc && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(payload));
      }
    } else if (type === 'ice-candidate') {
      const pc = this.peerConnections.get(senderId);
      if (pc && payload) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload));
        } catch (e) {
          console.debug('Failed to add ICE candidate', e);
        }
      }
    } else if (type === 'relay-request-chunk') {
      // Ephemeral relay request
      this.serveChunkViaRelay(payload.chunkIndex, senderId);
    }
  }

  private async initiateWebRTCConnection(targetPeerId: string) {
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      this.peerConnections.set(targetPeerId, pc);

      const dc = pc.createDataChannel('filepizza-transfer', { ordered: true });
      dc.binaryType = 'arraybuffer';
      this.dataChannels.set(targetPeerId, dc);

      dc.onopen = () => {
        this.onStatusUpdate?.('Direct WebRTC DataChannel established!', 'webrtc');
        // Send meta message
        dc.send(JSON.stringify({ type: 'meta', meta: this.meta }));
      };

      dc.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'request-chunk') {
            this.serveChunkViaDataChannel(msg.chunkIndex, dc);
          }
        } catch (e) {
          console.error(e);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignal(targetPeerId, 'ice-candidate', event.candidate);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await this.sendSignal(targetPeerId, 'offer', offer);
    } catch (e) {
      console.warn('WebRTC offer error:', e);
    }
  }

  private async serveChunkViaDataChannel(chunkIndex: number, dc: RTCDataChannel) {
    if (!this.currentFile || !this.meta || dc.readyState !== 'open') return;

    // Buffer flow control
    if (dc.bufferedAmount > 4 * 1024 * 1024) {
      setTimeout(() => this.serveChunkViaDataChannel(chunkIndex, dc), 50);
      return;
    }

    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, this.currentFile.size);
    const slice = this.currentFile.slice(start, end);
    const arrayBuffer = await slice.arrayBuffer();

    let payloadBuffer = arrayBuffer;
    if (this.cryptoKey) {
      payloadBuffer = await encryptChunk(arrayBuffer, this.cryptoKey);
    }

    // Send metadata header first or directly send with a 4-byte chunk index prefix
    const header = new Uint8Array(4);
    new DataView(header.buffer).setUint32(0, chunkIndex, false);

    const combined = new Uint8Array(4 + payloadBuffer.byteLength);
    combined.set(header, 0);
    combined.set(new Uint8Array(payloadBuffer), 4);

    dc.send(combined.buffer);

    this.totalBytesSent += end - start;
    this.updateStats('webrtc', chunkIndex + 1, this.meta.totalChunks);
  }

  private async serveChunkViaRelay(chunkIndex: number, targetPeerId: string) {
    if (!this.currentFile || !this.meta) return;

    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, this.currentFile.size);
    const slice = this.currentFile.slice(start, end);
    const arrayBuffer = await slice.arrayBuffer();

    let payloadBuffer = arrayBuffer;
    if (this.cryptoKey) {
      payloadBuffer = await encryptChunk(arrayBuffer, this.cryptoKey);
    }

    // Convert to base64 for ephemeral relay
    const bytes = new Uint8Array(payloadBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    try {
      await fetch(`/api/rooms/${this.roomId}/relay/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunkId: `${this.meta.fileId}-${chunkIndex}`,
          data: base64,
        }),
      });

      this.totalBytesSent += end - start;
      this.updateStats('relay', chunkIndex + 1, this.meta.totalChunks);
    } catch (e) {
      console.warn('Relay push failed', e);
    }
  }

  private async sendSignal(targetId: string, type: string, payload: any) {
    try {
      await fetch(`/api/rooms/${this.roomId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: this.peerId,
          targetId,
          type,
          payload,
        }),
      });
    } catch (e) {
      console.debug('Failed to send signal', e);
    }
  }

  private updateStats(transport: 'webrtc' | 'broadcast-channel' | 'relay', currentChunk: number, totalChunks: number) {
    const now = Date.now();
    const timeDelta = (now - this.lastSpeedCheckTime) / 1000;

    if (timeDelta >= 0.5) {
      const bytesDelta = this.totalBytesSent - this.lastSpeedCheckBytes;
      this.currentSpeedBps = Math.round(bytesDelta / timeDelta);
      this.lastSpeedCheckBytes = this.totalBytesSent;
      this.lastSpeedCheckTime = now;
    }

    const percentage = Math.min(100, Math.round((currentChunk / totalChunks) * 100));
    const remainingBytes = Math.max(0, (this.meta?.size || 0) - (currentChunk * CHUNK_SIZE));
    const etaSeconds = this.currentSpeedBps > 0 ? Math.ceil(remainingBytes / this.currentSpeedBps) : 0;

    this.onStatsUpdate?.({
      bytesTransferred: Math.min(this.meta?.size || 0, currentChunk * CHUNK_SIZE),
      totalBytes: this.meta?.size || 0,
      percentage,
      speedBps: this.currentSpeedBps,
      etaSeconds,
      chunksCompleted: currentChunk,
      totalChunks,
      peersCount: this.activePeers.size,
      transportType: transport,
    });
  }

  public getMetadata(): FileMetadata | null {
    return this.meta;
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.broadcastChannel?.close();
    this.dataChannels.forEach((dc) => dc.close());
    this.peerConnections.forEach((pc) => pc.close());
  }
}

/**
 * RECEIVER CLASS: Connects to a pizza room and downloads chunks until the file is complete.
 */
export class PizzaReceiver {
  private roomId: string;
  private peerId: string;
  private cryptoKey: CryptoKey | null = null;
  private meta: FileMetadata | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private pollInterval: any = null;
  private lastSignalTimestamp = 0;
  private isDestroyed = false;
  private receivedChunks = new Map<number, ArrayBuffer>();
  private pendingChunkRequests = new Set<number>();
  private activeTransport: 'webrtc' | 'broadcast-channel' | 'relay' = 'broadcast-channel';

  // Stats
  private totalBytesReceived = 0;
  private lastSpeedCheckTime = Date.now();
  private lastSpeedCheckBytes = 0;
  private currentSpeedBps = 0;
  private isDownloading = false;

  // Callbacks
  public onMetaReceived?: (meta: FileMetadata) => void;
  public onStatsUpdate?: ProgressCallback;
  public onComplete?: CompleteCallback;
  public onStatusUpdate?: StatusCallback;

  constructor(roomId: string, cryptoKey: CryptoKey | null) {
    this.roomId = roomId;
    this.peerId = 'receiver-' + Math.random().toString(36).substring(2, 9);
    this.cryptoKey = cryptoKey;
  }

  public setCryptoKey(key: CryptoKey) {
    this.cryptoKey = key;
  }

  public async connect(): Promise<FileMetadata | null> {
    // 1. Check server room info
    try {
      const res = await fetch(`/api/rooms/${this.roomId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.meta) {
          this.meta = data.meta;
          this.onMetaReceived?.(data.meta);
        }
      }
    } catch (e) {
      console.debug('Room check failed:', e);
    }

    // 2. Setup BroadcastChannel for local same-device transfer
    try {
      this.broadcastChannel = new BroadcastChannel(`filepizza-${this.roomId}`);
      this.broadcastChannel.onmessage = (event) => this.handleBroadcastMessage(event.data);
      this.broadcastChannel.postMessage({
        type: 'peer-ready',
        senderId: this.peerId,
      });
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }

    // 3. Register on signaling server
    try {
      await fetch(`/api/rooms/${this.roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerId: this.peerId }),
      });
    } catch (e) {
      console.warn('Join room error:', e);
    }

    // 4. Start polling for WebRTC signals
    this.startSignalingPoll();

    // 5. Send ready signal on server
    await this.sendSignal('peer-ready', {});

    return this.meta;
  }

  private handleBroadcastMessage(data: any) {
    if (!data || data.senderId === this.peerId) return;

    if (data.type === 'host-presence' || data.type === 'meta') {
      if (data.meta && !this.meta) {
        this.meta = data.meta;
        this.onMetaReceived?.(data.meta);
      }
    } else if (data.type === 'chunk-data') {
      if (data.targetId === this.peerId) {
        this.activeTransport = 'broadcast-channel';
        this.processReceivedChunk(data.chunkIndex, data.data);
      }
    }
  }

  private startSignalingPoll() {
    this.pollInterval = setInterval(async () => {
      if (this.isDestroyed) return;
      try {
        const res = await fetch(
          `/api/rooms/${this.roomId}/signals?peerId=${this.peerId}&since=${this.lastSignalTimestamp}`
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.meta && !this.meta) {
          this.meta = data.meta;
          this.onMetaReceived?.(data.meta);
        }

        if (data.signals && data.signals.length > 0) {
          for (const signal of data.signals) {
            this.lastSignalTimestamp = Math.max(this.lastSignalTimestamp, signal.timestamp);
            this.handleSignal(signal);
          }
        }
      } catch (e) {
        // network glitch
      }
    }, 1000);
  }

  private async handleSignal(signal: any) {
    const { senderId, type, payload } = signal;

    if (type === 'offer') {
      this.setupWebRTCAnswer(senderId, payload);
    } else if (type === 'ice-candidate') {
      if (this.pc && payload) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(payload));
        } catch (e) {
          console.debug('Failed to add candidate', e);
        }
      }
    }
  }

  private async setupWebRTCAnswer(senderId: string, offer: any) {
    try {
      this.pc = new RTCPeerConnection(ICE_SERVERS);

      this.pc.ondatachannel = (event) => {
        this.dc = event.channel;
        this.dc.binaryType = 'arraybuffer';
        this.activeTransport = 'webrtc';
        this.onStatusUpdate?.('Connected directly via WebRTC DataChannel!', 'webrtc');

        this.dc.onmessage = (msgEvent) => {
          if (typeof msgEvent.data === 'string') {
            try {
              const msg = JSON.parse(msgEvent.data);
              if (msg.type === 'meta' && !this.meta) {
                this.meta = msg.meta;
                this.onMetaReceived?.(msg.meta);
              }
            } catch (e) {}
          } else if (msgEvent.data instanceof ArrayBuffer) {
            // First 4 bytes are chunkIndex
            const view = new DataView(msgEvent.data);
            const chunkIndex = view.getUint32(0, false);
            const chunkData = msgEvent.data.slice(4);
            this.processReceivedChunk(chunkIndex, chunkData);
          }
        };

        if (this.isDownloading) {
          this.requestNextChunks();
        }
      };

      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignal('ice-candidate', event.candidate, senderId);
        }
      };

      await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      await this.sendSignal('answer', answer, senderId);
    } catch (e) {
      console.warn('WebRTC answer error', e);
    }
  }

  private async sendSignal(type: string, payload: any, targetId?: string) {
    try {
      await fetch(`/api/rooms/${this.roomId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: this.peerId,
          targetId,
          type,
          payload,
        }),
      });
    } catch (e) {
      console.debug('Signaling error', e);
    }
  }

  /**
   * User clicks "Grab a Slice" to start downloading
   */
  public async startDownload() {
    this.isDownloading = true;
    this.requestNextChunks();

    // Fallback timer: if 3 seconds pass and 0 chunks received, start pulling relay
    setTimeout(() => {
      if (this.isDownloading && this.receivedChunks.size === 0) {
        this.pullViaRelay();
      }
    }, 3000);
  }

  private requestNextChunks() {
    if (!this.meta || !this.isDownloading) return;

    const total = this.meta.totalChunks;
    // Request up to 4 parallel chunks for pipeline throughput
    for (let i = 0; i < total; i++) {
      if (!this.receivedChunks.has(i) && !this.pendingChunkRequests.has(i)) {
        if (this.pendingChunkRequests.size >= 6) break;

        this.pendingChunkRequests.add(i);

        if (this.dc && this.dc.readyState === 'open') {
          this.dc.send(JSON.stringify({ type: 'request-chunk', chunkIndex: i }));
        } else if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({
            type: 'request-chunk',
            senderId: this.peerId,
            chunkIndex: i,
          });
        }

        // Retry chunk if not received within 2.5s
        setTimeout(() => {
          if (this.isDownloading && !this.receivedChunks.has(i)) {
            this.pendingChunkRequests.delete(i);
            this.requestNextChunks();
          }
        }, 2500);
      }
    }
  }

  private async pullViaRelay() {
    if (!this.meta || !this.isDownloading) return;

    this.activeTransport = 'relay';
    this.onStatusUpdate?.('Downloading via encrypted peer relay...', 'relay');

    for (let i = 0; i < this.meta.totalChunks; i++) {
      if (this.receivedChunks.has(i)) continue;

      // Ask sender via signal to push to relay
      await this.sendSignal('relay-request-chunk', { chunkIndex: i });

      // Poll relay endpoint for this chunk
      let attempts = 0;
      let fetched = false;
      while (attempts < 15 && !fetched && this.isDownloading) {
        attempts++;
        try {
          const res = await fetch(`/api/rooms/${this.roomId}/relay/pull/${this.meta.fileId}-${i}`);
          if (res.ok) {
            const data = await res.json();
            const binary = atob(data.data);
            const bytes = new Uint8Array(binary.length);
            for (let b = 0; b < binary.length; b++) {
              bytes[b] = binary.charCodeAt(b);
            }
            this.processReceivedChunk(i, bytes.buffer);
            fetched = true;
            break;
          }
        } catch (e) {}
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  private async processReceivedChunk(chunkIndex: number, rawBuffer: ArrayBuffer) {
    if (this.receivedChunks.has(chunkIndex) || !this.meta) return;

    this.pendingChunkRequests.delete(chunkIndex);

    let decryptedBuffer = rawBuffer;
    if (this.meta.isEncrypted && this.cryptoKey) {
      try {
        decryptedBuffer = await decryptChunk(rawBuffer, this.cryptoKey);
      } catch (err) {
        console.error('Decryption failed for chunk', chunkIndex, err);
        return;
      }
    }

    this.receivedChunks.set(chunkIndex, decryptedBuffer);
    this.totalBytesReceived += decryptedBuffer.byteLength;

    // Update stats
    this.updateStats();

    // Check if finished!
    if (this.receivedChunks.size >= this.meta.totalChunks) {
      this.assembleAndComplete();
    } else {
      // Request next chunks in the pipeline
      this.requestNextChunks();
    }
  }

  private updateStats() {
    if (!this.meta) return;

    const now = Date.now();
    const timeDelta = (now - this.lastSpeedCheckTime) / 1000;

    if (timeDelta >= 0.5) {
      const bytesDelta = this.totalBytesReceived - this.lastSpeedCheckBytes;
      this.currentSpeedBps = Math.round(bytesDelta / timeDelta);
      this.lastSpeedCheckBytes = this.totalBytesReceived;
      this.lastSpeedCheckTime = now;
    }

    const currentChunks = this.receivedChunks.size;
    const totalChunks = this.meta.totalChunks;
    const percentage = Math.min(100, Math.round((currentChunks / totalChunks) * 100));
    const remainingBytes = Math.max(0, this.meta.size - this.totalBytesReceived);
    const etaSeconds = this.currentSpeedBps > 0 ? Math.ceil(remainingBytes / this.currentSpeedBps) : 0;

    this.onStatsUpdate?.({
      bytesTransferred: this.totalBytesReceived,
      totalBytes: this.meta.size,
      percentage,
      speedBps: this.currentSpeedBps,
      etaSeconds,
      chunksCompleted: currentChunks,
      totalChunks,
      peersCount: 1,
      transportType: this.activeTransport,
    });
  }

  private assembleAndComplete() {
    if (!this.meta) return;

    const sortedChunks: ArrayBuffer[] = [];
    for (let i = 0; i < this.meta.totalChunks; i++) {
      const chunk = this.receivedChunks.get(i);
      if (chunk) sortedChunks.push(chunk);
    }

    const blob = new Blob(sortedChunks, { type: this.meta.mimeType });
    this.isDownloading = false;

    this.onComplete?.(blob, this.meta);
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.broadcastChannel?.close();
    this.dc?.close();
    this.pc?.close();
  }
}
