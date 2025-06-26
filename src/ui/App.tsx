import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import FileSelector from './components/FileSelector';
import type { FileInfo } from './components/FileSelector';
import VideoPlayer from './components/VideoPlayer';
import './App.css';

// let socket: Socket;

export default function App() {
  const [step, setStep] = useState<'pick'|'lobby'|'play'>('pick');
  const [filePath, setFilePath] = useState<string>('');
  const [hash, setHash] = useState<string>('');
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [copied, setCopied] = useState(false);
  const [isHost, setIsHost] = useState(false);

  // init socket
  useEffect(() => {
      const sock = io('http://localhost:4000');
      setSocket(sock);
      // optional: expose for debugging
      (window as any).socket = sock;

      return () => {
        sock.disconnect();
        setSocket(null);
      };
    }, []);

  // when file is picked+hashed+metadata loaded
  function onFileReady(fp: string, h: string, info: FileInfo) {
    setFilePath(fp);
    setHash(h);
    setFileInfo(info);
    setStep('lobby');
  }

  // Create room as host
  function createRoom() {
    if (!socket) {
      console.error('Socket not initialized yet');
      return;
    }
    socket.emit('room:create', hash, ({ roomId }: { roomId: string }) => {
      setRoomId(roomId);
      setIsHost(true);
    });
  }

  // Join existing room as guest
  function joinRoom() {
    setError('');
   if (!socket) {
     console.error('Socket not initialized yet');
     setError('Still connecting… please wait a moment.');
     return;
   }
    const code = joinCode.trim().toUpperCase();
    socket.emit('room:join', code, hash, (res: any) => {
      if (res.error) {
        setError(res.error);
      } else {
        setIsHost(false); 
        setRoomId(code);
        setStep('play');
        // TODO: show "Waiting for host to start playback..."
      }
    });
  }

   // New: copy the room code to clipboard
   async function copyCode() {
     try {
       await navigator.clipboard.writeText(roomId);
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
     } catch (e) {
       console.error('Copy failed', e);
     }
   }


  return (
  <div className="app-container">
      {/* PICK STEP: Welcome + File Selector */}
      {step === 'pick' && (
        <div className="welcome">
          <h1>SyncNest</h1>
          <p>
            Upload a media file from your local device to <strong><i>create a new room</i></strong> or 
            <strong><i> join an existing one</i></strong>.
          </p>
          <FileSelector onReady={onFileReady} />
        </div>
      )}

      {/* LOBBY STEP: File details, Create or Join */}
      {step === 'lobby' && fileInfo && (
        <>
          {/* File metadata */}
          <div className="file-details">
            <p><strong>File:</strong> {fileInfo.name}</p>
            <p><strong>Size:</strong> {(fileInfo.size/1e6).toFixed(1)} MB</p>
            <p><strong>Resolution:</strong> {fileInfo.width}×{fileInfo.height}</p>
            <p><strong>Duration:</strong> {new Date(fileInfo.duration*1000).toISOString().substr(11,8)}</p>
            <p><strong>Modified:</strong> {new Date(fileInfo.modified).toLocaleString()}</p>
          </div>

          {/* Create Room section */}
          <section className="create-room">
            <h2>Create a New Room</h2>
            <button
              className="primary"
              onClick={createRoom}
              disabled={!socket || !fileInfo}
            >
              🚀 Create Room
            </button>

            {roomId && (
              <>
                <p className="room-code">
                  Your room code: <strong>{roomId}</strong>
                  <button
                    className="copy-button"
                    onClick={copyCode}
                    title="Copy room code"
                  >
                    📋
                  </button>
                  {copied && <span className="copied-feedback">Copied!</span>}
                </p>

                {isHost && (
                  <button
                    className="primary"
                    onClick={() => setStep('play')}
                  >
                    ▶️ Start Playback
                  </button>
                )}
              </>
            )}
          </section>

          {/* Join Room section */}
          <section className="join-room">
            <h2>Join an Existing Room</h2>
            <div className="join">
              <input
                className="room-input"
                type="text"
                placeholder="Enter Room Code"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                disabled={!socket}
              />
              <button
                className="primary"
                onClick={joinRoom}
                disabled={!socket || joinCode.trim().length === 0}
              >
                🔑 Join Room
              </button>
            </div>
            {error && <p className="error">❌ {error}</p>}
          </section>

          {/* Waiting overlays (placeholders) */}
          {/* {isHost && roomId && <div className="overlay">Waiting for guest to join…</div>} */}
          {/* {!isHost && roomId && <div className="overlay">Waiting for host to start playback…</div>} */}
        </>
      )}

      {/* PLAY STEP: Video player */}
      {step === 'play' && (
        <VideoPlayer
          filePath={filePath}
          roomId={roomId}
          isHost={isHost}
        />
      )}

    </div>
  );
}
