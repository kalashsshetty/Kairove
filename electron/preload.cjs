const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('kairove', {
 setKey: key => ipcRenderer.invoke('key', key),
 transcribe: data => ipcRenderer.invoke('transcribe', data),
 answer: data => ipcRenderer.invoke('answer', data),
 sources: () => ipcRenderer.invoke('sources'),
 screenshot: id => ipcRenderer.invoke('screenshot', id)
});
