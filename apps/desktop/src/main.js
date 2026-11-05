const { app, BrowserWindow, ipcMain, Menu, Tray, shell, nativeTheme } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow = null;
let tray = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const WEB_URL = process.env.SYNAPSEMED_WEB_URL || (isDev ? 'http://localhost:3000' : 'https://app.synapsemed.local');

function createWindow() {
  const bounds = store.get('windowBounds', { width: 1400, height: 900 });

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 1024,
    minHeight: 700,
    title: 'SynapseMed',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    backgroundColor: '#0f172a',
  });

  mainWindow.loadURL(WEB_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.on('resize', () => {
    if (mainWindow) store.set('windowBounds', mainWindow.getBounds());
  });

  mainWindow.on('move', () => {
    if (mainWindow) store.set('windowBounds', mainWindow.getBounds());
  });

  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin' && !app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

function createMenu() {
  const template = [
    {
      label: 'SynapseMed',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow?.webContents.send('navigate', '/settings'),
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        { label: 'New Encounter', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('navigate', '/encounter') },
        { label: 'New Patient', accelerator: 'CmdOrCtrl+Shift+N', click: () => mainWindow?.webContents.send('navigate', '/patients') },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Navigate',
      submenu: [
        { label: 'Dashboard', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.webContents.send('navigate', '/dashboard') },
        { label: 'Patients', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.webContents.send('navigate', '/patients') },
        { label: 'Appointments', accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.webContents.send('navigate', '/appointments') },
        { label: 'Billing', accelerator: 'CmdOrCtrl+4', click: () => mainWindow?.webContents.send('navigate', '/billing') },
        { label: 'ERPNext Integration', accelerator: 'CmdOrCtrl+5', click: () => mainWindow?.webContents.send('navigate', '/integrations/erpnext') },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://docs.synapsemed.local'),
        },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/SynapseMed/issues'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createTray() {
  try {
    tray = new Tray(path.join(__dirname, '../assets/tray-icon.png'));
  } catch {
    // Tray icon not available, skip
    return;
  }
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show SynapseMed', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setToolTip('SynapseMed');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

app.whenReady().then(() => {
  createWindow();
  createMenu();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-platform', () => process.platform);
