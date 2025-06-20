import { useState } from 'react';

export interface FileSelectorProps {
  onReady: (filePath: string, hash: string) => void;
}

export default function FileSelector({ onReady }: FileSelectorProps) {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pick() {
    setLoading(true);
    try {
      if (!window.electron) {
        throw new Error('window.electron API not found (preload failed to load)');
      }

      const fp = await window.electron.selectFile();
      if (!fp) {
        console.log('User cancelled file dialog');
        return;
      }
      setFilePath(fp);

      const h = await window.electron.computeHash(fp);
      setHash(h);
      onReady(fp, h);

    } catch (err: any) {
      console.error('Error in file pick/hash:', err);
      alert(`Failed to select or hash file:\n${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="file-selector">
      <button onClick={pick} disabled={loading}>
        {loading ? 'Loading…' : 'Select Video File'}
      </button>
      {filePath && <p>📂 Path: {filePath}</p>}
      {hash && <p>🔑 SHA-256: {hash.slice(0, 16) + '…'}</p>}
    </div>
  );
}
