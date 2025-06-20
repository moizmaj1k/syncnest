import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import FileSelector from './components/FileSelector';
import VideoPlayer from './components/VideoPlayer';
import './App.css';

let socket: Socket;

export default function App() {
  const [step, setStep] = useState<'pick'|'lobby'|'play'>('pick');
  const [filePath, setFilePath] = useState<string>('');
  const [hash, setHash] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    socket = io('http://localhost:4000');
    // expose globally for VideoPlayer
    (window as any).socket = socket;
    return () => { socket.disconnect(); };
  }, []);

  function onFileReady(fp: string, h: string) {
    setFilePath(fp);
    setHash(h);
    setStep('lobby');
  }

  function createRoom() {
    socket.emit('room:create', hash, ({ roomId }: { roomId: string }) => {
      setRoomId(roomId);
    });
  }

  function joinRoom(code: string) {
    setError('');
    socket.emit('room:join', code.trim().toUpperCase(), hash, (res: any) => {
      if (res.error) return setError(res.error);
      setRoomId(code);
      setStep('play');
    });
  }

  return (
    <div className="app-container">
      {step === 'pick' && (
        <FileSelector onReady={onFileReady} />
      )}

      {step === 'lobby' && (
        <div className="lobby">
          <button onClick={createRoom}>🚀 Create Room</button>
          <div>
            <input
              type="text"
              placeholder="Enter Room Code"
              onBlur={e => joinRoom(e.target.value)}
            />
          </div>
          {roomId && <p>Your room code: <strong>{roomId}</strong></p>}
          {error && <p className="error">❌ {error}</p>}
        </div>
      )}

      {step === 'play' && (
        <VideoPlayer filePath={filePath} roomId={roomId} />
      )}
    </div>
  );
}
