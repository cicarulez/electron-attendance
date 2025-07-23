const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadPeople: () => ipcRenderer.invoke('load-people'),
    savePeople: (peopleArray) => ipcRenderer.invoke('save-people', peopleArray),
    saveLog: (data) => ipcRenderer.invoke('save-log', data)
});
