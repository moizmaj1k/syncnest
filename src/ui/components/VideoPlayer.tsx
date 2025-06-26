import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import './VideoPlayer.css';

interface VideoPlayerProps {
  filePath: string;
  roomId: string;
  isHost: boolean;
  onLeave: () => void;  
}

interface HostState {
  isPlaying: boolean;
  currentTime: number;
}

export default function VideoPlayer({
  filePath,
  roomId,
  isHost,
  onLeave,                          
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastHostState = useRef<HostState>({ isPlaying: false, currentTime: 0 });
  const [health, setHealth] = useState<'green'|'yellow'|'red'>('green');
  const [userCount, setUserCount] = useState<number>(1);
  const [copied, setCopied] = useState(false);  


  // ─── ALWAYS load the file URL ─────────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      vid.src = window.electron.toFileURL(filePath);
    }
  }, [filePath]);

  // ─── Guest: listen for host sync events ─────────────────
  useEffect(() => {
    const video = videoRef.current;
    const socket: Socket = (window as any).socket;
    if (!video || !socket || isHost) return;

    const onSync = (payload: { type: 'play' | 'pause' | 'seek'; currentTime: number }) => {
      lastHostState.current = {
        isPlaying: payload.type === 'play',
        currentTime: payload.currentTime
      };
      if (payload.type === 'play')      video.play();
      else if (payload.type === 'pause') video.pause();
      else                               video.currentTime = payload.currentTime;
    };

    socket.on('sync:event', onSync);
    return () => { socket.off('sync:event', onSync); };
  }, [roomId, isHost]);

  // ─── Host: emit play/pause/seek ────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    const socket: Socket = (window as any).socket;
    if (!video || !socket || !isHost) return;

    const emit = (type: 'play'|'pause'|'seek') =>
      socket.emit('sync:event', { roomId, type, currentTime: video.currentTime });

    video.addEventListener('play', () => emit('play'));
    video.addEventListener('pause', () => emit('pause'));
    video.addEventListener('seeked', () => emit('seek'));

    return () => {
      video.removeEventListener('play', () => emit('play'));
      video.removeEventListener('pause', () => emit('pause'));
      video.removeEventListener('seeked', () => emit('seek'));
    };
  }, [roomId, isHost]);

  // ─── Host: reply to guest pings ────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    const socket: Socket = (window as any).socket;
    if (!video || !socket || !isHost) return;

    const onPing = ({ clientTime }: { clientTime: number }) => {
      socket.emit('sync:pong', {
        roomId,
        clientTime,
        hostTime: video.currentTime
      });
    };

    socket.on('sync:ping', onPing);
    return () => {
      socket.off('sync:ping', onPing);
    };
  }, [roomId, isHost]);
  // ─── Guest: send ping & handle host’s pong ─────────────
  useEffect(() => {
    const video = videoRef.current;
    const socket: Socket = (window as any).socket;
    if (!video || !socket || isHost) return;

    // every 5s send our currentTime
    const interval = setInterval(() => {
      socket.emit('sync:ping', { roomId, clientTime: video.currentTime });
    }, 5000);

    const onPong = ({ clientTime, hostTime }: { clientTime: number; hostTime: number }) => {
      const drift = hostTime - clientTime;
      const abs = Math.abs(drift);

      if (abs < 0.1) setHealth('green');
      else if (abs < 0.5) setHealth('yellow');
      else setHealth('red');

      if (abs > 0.5) {
        video.currentTime = hostTime;
      } else if (abs > 0.1) {
        video.playbackRate = 1 + drift / 5;
        setTimeout(() => { if (video) video.playbackRate = 1; }, 2000);
      }
    };

    socket.on('sync:pong', onPong);
    return () => {
      clearInterval(interval);
      socket.off('sync:pong', onPong);
    };
  }, [roomId, isHost]);

  // ─── Guest: revert unauthorized actions ─────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isHost) return;

    const revert = () => {
      const { isPlaying, currentTime } = lastHostState.current;
      if (Math.abs(video.currentTime - currentTime) > 0.1) {
        video.currentTime = currentTime;
      }
      isPlaying ? video.play().catch(()=>{}) : video.pause();
    };

    video.addEventListener('play', revert);
    video.addEventListener('pause', revert);
    video.addEventListener('seeked', revert);

    return () => {
      video.removeEventListener('play', revert);
      video.removeEventListener('pause', revert);
      video.removeEventListener('seeked', revert);
    };
  }, [roomId, isHost]);

  // ─── Track who’s in the room ─────────────────────────────
  useEffect(() => {
    const socket: Socket = (window as any).socket;
    if (!socket) return;

    // fetch the current head-count
    socket.emit('room:getPeers', roomId, (count: number) => {
      setUserCount(count);
    });
  
    // subscribe to live updates
    const onUpdate = (count: number) => setUserCount(count);
    socket.on('peer:update', onUpdate);
    return () => { socket.off('peer:update', onUpdate); };
  }, [roomId]);

  // ─── new: copy room code handler ─────────────────────
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // swallow
    }
  };

  return (
    <div className="video-player-container">
      {/* ─── HEADER BAR ──────────────────────────── */}
      <div className="player-header">
        <div className="header-left">
          <button
            className="leave-button"
            onClick={onLeave}
            aria-label="Leave Room"
          >
            <svg
              className="back-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <polyline points="15 19 8 12 15 5" />
            </svg>
          </button>
        </div>
        <div className="header-center">
          <span className="room-label">Room Code:</span>
          <strong className="room-code-header">{roomId}</strong>
          <button
            className="copy-button"
            onClick={copyCode}
            title="Copy code"
            aria-label="Copy room code"
          >
            📋
          </button>
          {copied && <span className="copied-feedback">Copied!</span>}
        </div>
        <div className="header-right">
          {/* NEW: show how many peers are here */}
          <div className="user-indicator" title="Peers in room">
            <svg className="user-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="3" />
              <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
            </svg>
            <span className="user-count">{userCount}</span>
          </div>
          {/* sync health dot */}
          <div className={`sync-health ${health}`} title="Sync health" />
        </div>
      </div>

      <video
        ref={videoRef}
        controls                /* always show native controls */
        className="video-element"
      />
    </div>
  );
}
