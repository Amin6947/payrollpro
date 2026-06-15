const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  print: () => ipcRenderer.invoke('print'),
  platform: process.platform,
  version: process.versions.electron
})
