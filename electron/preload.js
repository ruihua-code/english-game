const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronHost", {
  platform: process.platform,
  speak: (text, rate) => ipcRenderer.invoke("speech:speak", { text, rate }),
});
