// src/ui/global.d.ts

export {}; // this file is a module; keep it to avoid polluting the global scope

declare global {
  interface Window {
    electron: {
      /**
       * Opens the file dialog and returns the selected path, or null if cancelled
       */
      selectFile(): Promise<string | null>;

      /**
       * Computes SHA‐256 on the given file path and returns the hex digest
       */
      computeHash(filePath: string): Promise<string>;

      getFileInfo(fp: string): Promise<{
        name: string;
        size: number;
        modified: number;
      }>;

      toFileURL(path:string): string;
    };



    /** Socket.IO client instance for sync events */
    socket: import('socket.io-client').Socket;
  }
}
