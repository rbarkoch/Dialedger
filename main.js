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
  try {
    const result = db.deleteEntry(data.id);
    
    // Delete physical attachment files
    if (result.deletedAttachments && result.deletedAttachments.length > 0) {
      for (const attachment of result.deletedAttachments) {
        if (fs.existsSync(attachment.file_path)) {
          fs.unlinkSync(attachment.file_path);
          console.log('Deleted attachment file:', attachment.file_path);
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
});

// IPC Handler for selecting a file
ipcMain.handle('file:select', async (event) => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    const filePath = result.filePaths[0];
    const stats = fs.statSync(filePath);
    
    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      type: '', // Could add mime-type detection
    };
  } catch (error) {
    console.error('Error selecting file:', error);
    throw error;
  }
});

// IPC Handler for parsing .eml files
ipcMain.handle('eml:parse', async (event, filePath) => {
  try {
    const emlContent = fs.readFileSync(filePath, 'utf8');
    const parsed = await simpleParser(emlContent);
    
    // Extract attachment filenames
    const attachments = [];
    if (parsed.attachments && parsed.attachments.length > 0) {
      parsed.attachments.forEach(attachment => {
        if (attachment.filename) {
          attachments.push({
            filename: attachment.filename,
            contentType: attachment.contentType || '',
            size: attachment.size || 0,
          });
        }
      });
    }
    
    return {
      from: parsed.from?.text || '',
      to: parsed.to?.text || '',
      cc: parsed.cc?.text || '',
      bcc: parsed.bcc?.text || '',
      subject: parsed.subject || '',
      body: parsed.text || parsed.html || '',
      date: parsed.date || new Date(),
      messageId: parsed.messageId || '',
      attachments: attachments,
    };
  } catch (error) {
    console.error('Error parsing EML file:', error);
    throw error;
  }
});

// IPC Handlers for File Attachments
ipcMain.handle('attachments:save', async (event, data) => {
  try {
    const { filePath, fileName, entryId } = data;
    console.log('Saving attachment:', { filePath, fileName, entryId });
    
    // Create attachments directory in user data
    const userDataPath = app.getPath('userData');
    const attachmentsDir = path.join(userDataPath, 'attachments');
    
    if (!fs.existsSync(attachmentsDir)) {
      fs.mkdirSync(attachmentsDir, { recursive: true });
      console.log('Created attachments directory:', attachmentsDir);
    }
    
    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const uniqueFileName = `${timestamp}_${baseName}${ext}`;
    const destPath = path.join(attachmentsDir, uniqueFileName);
    
    // Copy file to attachments directory
    fs.copyFileSync(filePath, destPath);
    console.log('File copied to:', destPath);
    
    // Get file stats
    const stats = fs.statSync(destPath);
    
    // Save to database
    const attachment = await db.createAttachment({
      entryId: entryId,
      fileName: fileName,
      filePath: destPath,
      fileSize: stats.size,
      mimeType: null, // Could add mime-type detection if needed
    });
    
    console.log('Attachment saved to database:', attachment);
    return attachment;
  } catch (error) {
    console.error('Error saving attachment:', error);
    throw error;
  }
});

ipcMain.handle('attachments:getByEntry', async (event, data) => {
  console.log('Getting attachments for entry:', data.entryId);
  const attachments = db.getAttachmentsByEntry(data.entryId);
  console.log('Found attachments:', attachments);
  return attachments;
});

ipcMain.handle('attachments:download', async (event, data) => {
  try {
    const { dialog } = require('electron');
    const attachment = db.getAttachmentById(data.attachmentId);
    
    if (!attachment) {
      throw new Error('Attachment not found');
    }
    
    // Check if file exists
    if (!fs.existsSync(attachment.file_path)) {
      throw new Error('File not found on disk');
    }
    
    // Show save dialog
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: data.fileName || attachment.file_name,
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    // Copy file to selected location
    fs.copyFileSync(attachment.file_path, result.filePath);
    
    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Error downloading attachment:', error);
    throw error;
  }
});

ipcMain.handle('attachments:delete', async (event, data) => {
  try {
    const attachment = db.getAttachmentById(data.attachmentId);
    if (attachment && fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }
    return db.deleteAttachment(data.attachmentId);
  } catch (error) {
    console.error('Error deleting attachment:', error);
    throw error;
  }
});

// IPC Handler for search
ipcMain.handle('search', async (event, data) => {
  try {
    return db.search(data.query, data.options || {});
  } catch (error) {
    console.error('Error searching:', error);
    throw error;
  }
});
