import { useState } from 'react';

export interface FileInfo {
  name: string;
  size: number;
  modified: number;
  width: number;     // new
  height: number;    // new
  duration: number;  // new, in seconds
}

export interface FileSelectorProps {
  onReady: (filePath: string, hash: string, info: FileInfo) => void;
}

export default function FileSelector({ onReady }: FileSelectorProps) {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function pick() {
    setLoading(true);
    try {
      if (!window.electron) {
        throw new Error('window.electron API not found');
      }

      setStatus('Opening file dialog…');
      const fp = await window.electron.selectFile();
      if (!fp) return;

      setStatus('Fetching file info…');
      const infoBasic = await window.electron.getFileInfo(fp);

      setStatus('Loading metadata…');
      // use a hidden video element to grab width/height/duration
      const url = window.electron.toFileURL(fp);
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.src = url;
      await new Promise<void>((resolve, reject) => {
        vid.onloadedmetadata = () => resolve();
        vid.onerror = () => reject(new Error('Failed to load video metadata'));
      });

      const info: FileInfo = {
        ...infoBasic,
        width: vid.videoWidth,
        height: vid.videoHeight,
        duration: vid.duration,
      };

      setStatus('Computing SHA-256…');
      const h = await window.electron.computeHash(fp);

      onReady(fp, h, info);
    } catch (err: any) {
      console.error(err);
      alert(`Error selecting file:\n${err.message}`);
    } finally {
      setLoading(false);
      setStatus('');
    }
  }

  return (
    <div className="file-selector">
      <button className="primary" onClick={pick} disabled={loading}>
        {loading ? 'Please wait…' : 'Select Video File'}
      </button>

      {loading && (
        <div className="spinner-container">
          <div className="spinner" />
          <p className="status">{status}</p>
        </div>
      )}
    </div>
  );
}
