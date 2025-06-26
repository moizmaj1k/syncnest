import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import './VideoPlayer.css';

interface VideoPlayerProps {
  filePath: string;
  roomId: string;
  isHost: boolean;
}

interface HostState {
  isPlaying: boolean;
  currentTime: number;
}

export default function VideoPlayer({ filePath, roomId, isHost }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastHostState = useRef<HostState>({ isPlaying: false, currentTime: 0 });

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

  return (
    <div className="video-player-container">
      <video
        ref={videoRef}
        controls                /* always show native controls */
        className="video-element"
      />
    </div>
  );
}
