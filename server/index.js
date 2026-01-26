const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { simpleParser } = require('mailparser');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
db.initialize();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const attachmentsDir = path.join(db.getDataPath(), 'attachments');
    if (!fs.existsSync(attachmentsDir)) {
      fs.mkdirSync(attachmentsDir, { recursive: true });
    }
    cb(null, attachmentsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${timestamp}_${baseName}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '100mb' }));

// Serve static files from the built React app
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes

// Thread routes
app.get('/api/threads', (req, res) => {
  try {
    const threads = db.getAllThreads();
    res.json(threads);
  } catch (error) {
    console.error('Error getting threads:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/threads', (req, res) => {
  try {
    const thread = db.createThread(req.body);
    res.json(thread);
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ error: error.message });
  }
});

// Thread order update - must be before :id route to avoid matching 'order' as an id
app.put('/api/threads/order', (req, res) => {
  try {
    const result = db.updateThreadOrder(req.body.threadOrders);
    res.json(result);
  } catch (error) {
    console.error('Error updating thread order:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/threads/:id', (req, res) => {
  try {
    const thread = db.updateThread({ ...req.body, id: parseInt(req.params.id) });
    res.json(thread);
  } catch (error) {
    console.error('Error updating thread:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/threads/:id', (req, res) => {
  try {
    const result = db.deleteThread(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    console.error('Error deleting thread:', error);
    res.status(500).json({ error: error.message });
  }
});

// Entry routes
app.get('/api/entries/:threadId', (req, res) => {
  try {
    const entries = db.getEntriesByThread(parseInt(req.params.threadId));
    res.json(entries);
  } catch (error) {
    console.error('Error getting entries:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/entries', (req, res) => {
  try {
    const entry = db.createEntry(req.body);
    res.json(entry);
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/entries/:id', (req, res) => {
  try {
    const entry = db.updateEntry({ ...req.body, id: parseInt(req.params.id) });
    res.json(entry);
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/entries/:id', (req, res) => {
  try {
    const result = db.deleteEntry(parseInt(req.params.id));
    
    // Delete physical attachment files
    if (result.deletedAttachments && result.deletedAttachments.length > 0) {
      for (const attachment of result.deletedAttachments) {
        if (fs.existsSync(attachment.file_path)) {
          fs.unlinkSync(attachment.file_path);
          console.log('Deleted attachment file:', attachment.file_path);
        }
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: error.message });
  }
});

// Attachment routes
app.get('/api/attachments/:entryId', (req, res) => {
  try {
    const attachments = db.getAttachmentsByEntry(parseInt(req.params.entryId));
    res.json(attachments);
  } catch (error) {
    console.error('Error getting attachments:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/attachments/:entryId', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: `Upload failed: ${err.message}` });
    }
    
    try {
      const entryId = parseInt(req.params.entryId);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded. Note: Folders/packages cannot be uploaded.' });
      }
      
      const attachment = db.createAttachment({
        entryId,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
      });
      
      res.json(attachment);
    } catch (error) {
      console.error('Error saving attachment:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

app.get('/api/attachments/download/:id', (req, res) => {
  try {
    const attachment = db.getAttachmentById(parseInt(req.params.id));
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    res.download(attachment.file_path, attachment.file_name);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/attachments/:id', (req, res) => {
  try {
    const attachment = db.getAttachmentById(parseInt(req.params.id));
    if (attachment && fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }
    const result = db.deleteAttachment(parseInt(req.params.id));
    res.json(result);
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: error.message });
  }
});

// EML parsing route
app.post('/api/eml/parse', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const emlContent = fs.readFileSync(file.path, 'utf8');
    const parsed = await simpleParser(emlContent);
    
    // Clean up the temp file
    fs.unlinkSync(file.path);
    
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
    
    res.json({
      from: parsed.from?.text || '',
      to: parsed.to?.text || '',
      cc: parsed.cc?.text || '',
      bcc: parsed.bcc?.text || '',
      subject: parsed.subject || '',
      body: parsed.text || parsed.html || '',
      date: parsed.date || new Date(),
      messageId: parsed.messageId || '',
      attachments: attachments,
    });
  } catch (error) {
    console.error('Error parsing EML file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search route
app.post('/api/search', (req, res) => {
  try {
    const { query, options } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const results = db.search(query, options || {});
    res.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fallback to serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
