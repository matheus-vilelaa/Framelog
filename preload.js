const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getSpaceUsed: () => ipcRenderer.invoke('get-space-used'),
    getRetentionDays: () => ipcRenderer.invoke('get-retention-days'),
    setRetentionDays: (days) => ipcRenderer.invoke('set-retention-days', days),
    getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    closeWindow: () => ipcRenderer.send('window-close')
});
