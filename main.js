const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { simpleParser } = require('mailparser');
const db = require('./database');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In development, load from Vite dev server
  // In production, load from built files
  const isDev = !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  // Initialize database
  db.initialize();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for Threads
ipcMain.handle('threads:getAll', async () => {
  return db.getAllThreads();
});

ipcMain.handle('threads:create', async (event, data) => {
  return db.createThread(data);
});

ipcMain.handle('threads:update', async (event, data) => {
  return db.updateThread(data);
});

ipcMain.handle('threads:delete', async (event, data) => {
  return db.deleteThread(data.id);
});

ipcMain.handle('threads:updateOrder', async (event, data) => {
  return db.updateThreadOrder(data.threadOrders);
});

// IPC Handlers for Entries
ipcMain.handle('entries:getByThread', async (event, data) => {
  return db.getEntriesByThread(data.threadId);
});

ipcMain.handle('entries:create', async (event, data) => {
  return db.createEntry(data);
});

ipcMain.handle('entries:update', async (event, data) => {
  return db.updateEntry(data);
});

ipcMain.handle('entries:delete', async (event, data) => {
  return db.deleteEntry(data.id);
});

// IPC Handler for parsing .eml files
ipcMain.handle('eml:parse', async (event, filePath) => {
  try {
    const emlContent = fs.readFileSync(filePath, 'utf8');
    const parsed = await simpleParser(emlContent);
    
    return {
      from: parsed.from?.text || '',
      to: parsed.to?.text || '',
      subject: parsed.subject || '',
      body: parsed.text || parsed.html || '',
      date: parsed.date || new Date(),
    };
  } catch (error) {
    console.error('Error parsing EML file:', error);
    throw error;
  }
});
