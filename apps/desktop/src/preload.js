const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (_event, path) => callback(path));
    return () => ipcRenderer.removeAllListeners('navigate');
  },
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
