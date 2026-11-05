# SynapseMed Desktop App

Electron-based desktop application for SynapseMed PMS.

## Features
- Native desktop experience with system menu and tray
- Keyboard shortcuts for common actions
- Offline-ready architecture
- Connects to SynapseMed web app or API

## Development
```bash
npm install
npm run dev
```

## Building
```bash
npm run build:linux  # Linux (AppImage, deb)
npm run build:win    # Windows (nsis)
npm run build:mac    # macOS (dmg)
```

## Configuration
Set `SYNAPSEMED_WEB_URL` environment variable to point to your SynapseMed instance.
Default: http://localhost:3000 (dev), https://app.synapsemed.local (prod)
