# SyncNest



## Overview

SyncNest is a desktop application for watching local media (MP4s, series, etc.) in perfect sync with friends or family, no matter where they are. It enables:

- 🔁 **File Fingerprint Matching** using SHA-256 to ensure both users have the same file
- 📺 **Real-Time Synchronized Playback** (play, pause, seek) via Socket.IO or optional WebRTC
- 💬 **Live Chat & Emoji Reactions** alongside video playback
- 🧠 **Smart Subtitle Sync** for `.srt` and `.vtt` files
- 🎧 **Audio Drift Correction** to adjust for lag on long videos
- 🔐 **Room & Session Codes** for secure, easy joining
- 🌓 **Dark Mode & Themes** for personalized UI

> *Ideal for long-distance relationships, families, or friends who want a seamless "watch together" experience without streaming platform limitations.*

## Tech Stack

- **Frontend**: Electron + React (Vite + TypeScript)
- **Backend**: Node.js + Socket.IO for signaling & sync
- **P2P Option**: WebRTC DataChannels
- **Packaging**: Electron Forge + `electron-builder`
- **Hashing**: Node.js `crypto` module

---

## Getting Started

### Prerequisites

- **Node.js** (v18.x or higher) and **npm**
- **Git**

### Clone the repository

```bash
git clone https://github.com/moizmaj1k/syncnest.git
cd syncnest
```

### Install dependencies

```bash
npm install
```

### Running in development

1. **Start Vite (React) server**
   ```bash
   npm run dev
   ```
2. **Start Electron with live reload**
   ```bash
   npm run dev:electron
   ```

> This will concurrently launch Vite, compile your Electron main process, and open the Electron window pointing at `http://localhost:5173`.

### Build for production

Compile both the Electron main process and Vite frontend:

```bash
npm run build
```

### Create desktop installers

Use `electron-builder` to generate platform-specific packages. After building:

- **Windows (x64)**
  ```bash
  npm run dist:win
  ```
- **macOS**
  ```bash
  npm run dist:mac
  ```
- **Linux (AppImage)**
  ```bash
  npm run dist:linux
  ```

Your installers and unpacked apps will appear under the `dist/` directory.

---

## Contributing

1. Fork the repo and create a new branch:
   ```bash
   ```

git checkout -b feat/awesome-feature

````
2. Commit your changes:
```bash
git commit -m "feat: add awesome-feature"
````

3. Push and open a Pull Request.

Please follow the [Conventional Commits](https://www.conventionalcommits.org/) format.

---

## License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

