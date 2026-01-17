const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Threads
  getAllThreads: () => ipcRenderer.invoke('threads:getAll'),
  createThread: (data) => ipcRenderer.invoke('threads:create', data),
  updateThread: (data) => ipcRenderer.invoke('threads:update', data),
  deleteThread: (data) => ipcRenderer.invoke('threads:delete', data),
  updateThreadOrder: (data) => ipcRenderer.invoke('threads:updateOrder', data),
  
  // Entries
  getEntriesByThread: (data) => ipcRenderer.invoke('entries:getByThread', data),
  createEntry: (data) => ipcRenderer.invoke('entries:create', data),
  updateEntry: (data) => ipcRenderer.invoke('entries:update', data),
  deleteEntry: (data) => ipcRenderer.invoke('entries:delete', data),
  
  // EML parsing
  parseEmlFile: (filePath) => ipcRenderer.invoke('eml:parse', filePath),
  
  // File selection
  selectFile: () => ipcRenderer.invoke('file:select'),
  
  // Attachments
  saveAttachment: (data) => ipcRenderer.invoke('attachments:save', data),
  getAttachmentsByEntry: (data) => ipcRenderer.invoke('attachments:getByEntry', data),
  downloadAttachment: (data) => ipcRenderer.invoke('attachments:download', data),
  deleteAttachment: (data) => ipcRenderer.invoke('attachments:delete', data),

  // Search
  search: (data) => ipcRenderer.invoke('search', data),
});
