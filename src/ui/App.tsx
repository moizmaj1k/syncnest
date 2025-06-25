import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import FileSelector from './components/FileSelector';
import type { FileInfo } from './components/FileSelector';
import VideoPlayer from './components/VideoPlayer';
import './App.css';

let socket: Socket;

export default function App() {
  const [step, setStep] = useState<'pick'|'lobby'|'play'>('pick');
  const [filePath, setFilePath] = useState<string>('');
  const [hash, setHash] = useState<string>('');
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    socket = io('http://localhost:4000');
    (window as any).socket = socket;
    return () => { socket.disconnect(); };
  }, []);

  function onFileReady(fp: string, h: string, info: FileInfo) {
    setFilePath(fp);
    setHash(h);
    setFileInfo(info);
    setStep('lobby');
  }

  function createRoom() {
    setError('');
    socket.emit('room:create', hash, ({ roomId }: { roomId: string }) => {
      setRoomId(roomId);
    });
  }

  function joinRoom(code: string) {
    setError('');
    socket.emit('room:join', code.trim().toUpperCase(), hash, (res: any) => {
      if (res.error) return setError(res.error);
      setRoomId(code.trim().toUpperCase());
      setStep('play');
    });
  }

  return (
    <div className="app-container">
      {step === 'pick' && (
        <FileSelector onReady={onFileReady} />
      )}

      {step === 'lobby' && fileInfo && (
        <>
          <div className="file-details">
            <p><strong>File:</strong> {fileInfo.name}</p>
            <p><strong>Size:</strong> {(fileInfo.size/1e6).toFixed(1)} MB</p>
            <p><strong>Resolution:</strong> {fileInfo.width}×{fileInfo.height}</p>
            <p><strong>Duration:</strong> {new Date(fileInfo.duration*1000).toISOString().substr(11,8)}</p>
            <p><strong>Modified:</strong> {new Date(fileInfo.modified).toLocaleString()}</p>
          </div>
          <div className="controls">
            <button className="primary" onClick={createRoom}>🚀 Create Room</button>
            <div className="join">
              <input
                className="room-input"
                type="text"
                placeholder="Enter Room Code"
                onBlur={e=>joinRoom(e.target.value)}
              />
              {error && <p className="error">❌ {error}</p>}
            </div>
          </div>
          {roomId && <p style={{marginTop:'1rem'}}>Your room code: <strong>{roomId}</strong></p>}
        </>
      )}

      {step === 'play' && (
        <VideoPlayer filePath={filePath} roomId={roomId} />
      )}
    </div>
  );
}
