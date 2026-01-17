// API abstraction layer that works with both Electron and web environments

const isElectron = typeof window !== 'undefined' && window.electronAPI;

// Web API client for when running in browser
const webAPI = {
  // Threads
  getAllThreads: async () => {
    const response = await fetch('/api/threads');
    if (!response.ok) throw new Error('Failed to fetch threads');
    return response.json();
  },
  
  createThread: async (data) => {
    const response = await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create thread');
    return response.json();
  },
  
  updateThread: async (data) => {
    const response = await fetch(`/api/threads/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update thread');
    return response.json();
  },
  
  deleteThread: async (data) => {
    const response = await fetch(`/api/threads/${data.id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete thread');
    return response.json();
  },
  
  updateThreadOrder: async (data) => {
    const response = await fetch('/api/threads/order', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update thread order');
    return response.json();
  },
  
  // Entries
  getEntriesByThread: async (data) => {
    const response = await fetch(`/api/entries/${data.threadId}`);
    if (!response.ok) throw new Error('Failed to fetch entries');
    return response.json();
  },
  
  createEntry: async (data) => {
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create entry');
    return response.json();
  },
  
  updateEntry: async (data) => {
    const response = await fetch(`/api/entries/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update entry');
    return response.json();
  },
  
  deleteEntry: async (data) => {
    const response = await fetch(`/api/entries/${data.id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete entry');
    return response.json();
  },
  
  // Attachments
  getAttachmentsByEntry: async (data) => {
    const response = await fetch(`/api/attachments/${data.entryId}`);
    if (!response.ok) throw new Error('Failed to fetch attachments');
    return response.json();
  },
  
  saveAttachment: async (data) => {
    // data.file should be the File object from selectFile()
    if (!data.file) {
      throw new Error('No file provided for upload');
    }
    
    const formData = new FormData();
    formData.append('file', data.file);
    
    const response = await fetch(`/api/attachments/${data.entryId}`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to save attachment');
    return response.json();
  },
  
  downloadAttachment: async (data) => {
    // For web, we trigger a download via anchor click
    const link = document.createElement('a');
    link.href = `/api/attachments/download/${data.attachmentId}`;
    link.download = data.fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true };
  },
  
  deleteAttachment: async (data) => {
    const response = await fetch(`/api/attachments/${data.attachmentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete attachment');
    return response.json();
  },
  
  // EML parsing - for web, this uses file upload
  parseEmlFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/eml/parse', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to parse EML file');
    return response.json();
  },
  
  // File selection - in web we use a file input
  selectFile: async () => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          resolve({
            file, // Include the actual file for upload
            path: file.name,
            name: file.name,
            size: file.size,
            type: file.type,
          });
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  },

  // Search
  search: async (data) => {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to search');
    return response.json();
  },
};

// Export the appropriate API based on environment
const api = isElectron ? window.electronAPI : webAPI;

export default api;
export { isElectron };
