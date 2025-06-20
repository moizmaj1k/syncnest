import { useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';

declare global {
  interface Window { socket: Socket; }
}

interface VideoPlayerProps {
  filePath: string;
  roomId: string;
}

export default function VideoPlayer({ filePath, roomId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    // load local file
    videoRef.current.src = `file://${filePath}`;
    // listen for sync events
    window.socket.on('sync:event', ({ type, currentTime }: any) => {
      const vid = videoRef.current!;
      if (type === 'play') vid.play();
      if (type === 'pause') vid.pause();
      if (type === 'seek') vid.currentTime = currentTime;
    });

    return () => {
      window.socket.off('sync:event');
    };
  }, [filePath, roomId]);

  function emit(type: 'play' | 'pause' | 'seek') {
    if (!videoRef.current) return;
    window.socket.emit('sync:event', {
      roomId,
      type,
      currentTime: videoRef.current.currentTime,
    });
  }

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        controls
        style={{ width: '100%', maxHeight: '80vh' }}
        onPlay={() => emit('play')}
        onPause={() => emit('pause')}
        onSeeked={() => emit('seek')}
      />
    </div>
  );
}
