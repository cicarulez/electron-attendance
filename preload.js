const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadPeople: () => ipcRenderer.invoke('load-people'),
    savePeople: (peopleArray) => ipcRenderer.invoke('save-people', peopleArray),
    saveLog: (data) => ipcRenderer.invoke('save-log', data),
    setSmallMode: () => ipcRenderer.send('set-small-mode'),
    setNormalMode: () => ipcRenderer.send('set-normal-mode'),
    setAlwaysOnTop: (value) => ipcRenderer.send('set-always-on-top', value),
    restorePreferences: (prefs) => ipcRenderer.send('restore-preferences', prefs)
});
