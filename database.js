const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

let db;

function initialize() {
  // Store database in user data directory
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'dialedger.db');
  
  // Ensure directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      entry_type TEXT NOT NULL CHECK(entry_type IN ('note', 'meeting', 'conversation', 'email', 'file', 'action_items')),
      title TEXT,
      content TEXT,
      entry_date DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT,
      FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_entries_thread_id ON entries(thread_id);
    CREATE INDEX IF NOT EXISTS idx_entries_entry_date ON entries(entry_date);
    CREATE INDEX IF NOT EXISTS idx_attachments_entry_id ON attachments(entry_id);
  `);
  
  // Migration: Add display_order column if it doesn't exist
  try {
    const columns = db.pragma('table_info(threads)');
    const hasDisplayOrder = columns.some(col => col.name === 'display_order');

    if (!hasDisplayOrder) {
      db.exec('ALTER TABLE threads ADD COLUMN display_order INTEGER DEFAULT 0');
      // Set display_order based on updated_at for existing threads
      db.exec('UPDATE threads SET display_order = id WHERE display_order = 0');
      console.log('Added display_order column to threads table');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }

  // Migration: Update entries table to include 'action_items' in CHECK constraint
  try {
    // Check if the table needs migration by trying to insert an action_items entry
    const testStmt = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='entries'");
    const tableInfo = testStmt.get();

    if (tableInfo && tableInfo.sql && !tableInfo.sql.includes("'action_items'")) {
      console.log('Migrating entries table to add action_items entry type...');

      db.exec(`
        -- Create new table with updated constraint
        CREATE TABLE entries_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          thread_id INTEGER NOT NULL,
          entry_type TEXT NOT NULL CHECK(entry_type IN ('note', 'meeting', 'conversation', 'email', 'file', 'action_items')),
          title TEXT,
          content TEXT,
          entry_date DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          metadata TEXT,
          FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
        );

        -- Copy data from old table
        INSERT INTO entries_new SELECT * FROM entries;

        -- Drop old table
        DROP TABLE entries;

        -- Rename new table
        ALTER TABLE entries_new RENAME TO entries;

        -- Recreate indexes
        CREATE INDEX IF NOT EXISTS idx_entries_thread_id ON entries(thread_id);
        CREATE INDEX IF NOT EXISTS idx_entries_entry_date ON entries(entry_date);
      `);

      console.log('Successfully migrated entries table to include action_items');
    }
  } catch (error) {
    console.error('Migration error for action_items:', error);
  }
  
  console.log('Database initialized at:', dbPath);
}

// Thread operations
function getAllThreads() {
  const stmt = db.prepare('SELECT * FROM threads ORDER BY display_order ASC, updated_at DESC');
  return stmt.all();
}

function createThread(data) {
  // Get max display_order and add 1
  const maxOrder = db.prepare('SELECT MAX(display_order) as max FROM threads').get();
  const newOrder = (maxOrder.max || 0) + 1;
  
  const stmt = db.prepare('INSERT INTO threads (title, description, display_order) VALUES (?, ?, ?)');
  const info = stmt.run(data.title, data.description || null, newOrder);
  return { id: info.lastInsertRowid, ...data, display_order: newOrder };
}

function updateThread(data) {
  const stmt = db.prepare('UPDATE threads SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(data.title, data.description, data.id);
  return data;
}

function deleteThread(id) {
  const stmt = db.prepare('DELETE FROM threads WHERE id = ?');
  stmt.run(id);
  return { success: true };
}

function updateThreadOrder(threadOrders) {
  // threadOrders is an array of { id, order } objects
  const stmt = db.prepare('UPDATE threads SET display_order = ? WHERE id = ?');
  const updateMany = db.transaction((orders) => {
    for (const item of orders) {
      stmt.run(item.order, item.id);
    }
  });
  updateMany(threadOrders);
  return { success: true };
}

// Entry operations
function getEntriesByThread(threadId) {
  const stmt = db.prepare('SELECT * FROM entries WHERE thread_id = ? ORDER BY entry_date ASC');
  return stmt.all(threadId);
}

function createEntry(data) {
  const stmt = db.prepare(`
    INSERT INTO entries (thread_id, entry_type, title, content, entry_date, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const metadataString = data.metadata ? JSON.stringify(data.metadata) : null;
  const info = stmt.run(
    data.threadId,
    data.entryType,
    data.title || null,
    data.content || null,
    data.entryDate,
    metadataString
  );
  
  // Update thread's updated_at timestamp
  const updateStmt = db.prepare('UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  updateStmt.run(data.threadId);
  
  return { id: info.lastInsertRowid, ...data, metadata: metadataString };
}

function updateEntry(data) {
  const stmt = db.prepare(`
    UPDATE entries 
    SET title = ?, content = ?, entry_date = ?, metadata = ?
    WHERE id = ?
  `);
  const metadataString = data.metadata ? JSON.stringify(data.metadata) : null;
  stmt.run(data.title, data.content, data.entryDate, metadataString, data.id);
  
  // Update thread's updated_at timestamp
  const entry = db.prepare('SELECT thread_id FROM entries WHERE id = ?').get(data.id);
  if (entry) {
    const updateStmt = db.prepare('UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(entry.thread_id);
  }
  
  return { ...data, metadata: metadataString };
}

function deleteEntry(id) {
  // Get thread_id and attachments before deleting
  const entry = db.prepare('SELECT thread_id FROM entries WHERE id = ?').get(id);
  const attachments = db.prepare('SELECT * FROM attachments WHERE entry_id = ?').all(id);
  
  // Delete the entry (attachments will be cascade deleted due to FOREIGN KEY constraint)
  const stmt = db.prepare('DELETE FROM entries WHERE id = ?');
  stmt.run(id);
  
  // Update thread's updated_at timestamp
  if (entry) {
    const updateStmt = db.prepare('UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(entry.thread_id);
  }
  
  return { success: true, deletedAttachments: attachments };
}

// Attachment operations
function createAttachment(data) {
  const stmt = db.prepare(`
    INSERT INTO attachments (entry_id, file_name, file_path, file_size, mime_type)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    data.entryId,
    data.fileName,
    data.filePath,
    data.fileSize || null,
    data.mimeType || null
  );
  return { id: info.lastInsertRowid, ...data };
}

function getAttachmentsByEntry(entryId) {
  const stmt = db.prepare('SELECT * FROM attachments WHERE entry_id = ?');
  return stmt.all(entryId);
}

function getAttachmentById(id) {
  const stmt = db.prepare('SELECT * FROM attachments WHERE id = ?');
  return stmt.get(id);
}

function deleteAttachment(id) {
  const stmt = db.prepare('DELETE FROM attachments WHERE id = ?');
  stmt.run(id);
  return { success: true };
}

// Search function - searches across threads and entries
function search(query, options = {}) {
  const { entryTypes, threadId } = options;
  const searchTerm = `%${query}%`;
  const results = {
    threads: [],
    entries: [],
  };

  // Search threads (title and description)
  const threadStmt = db.prepare(`
    SELECT * FROM threads
    WHERE title LIKE ? OR description LIKE ?
    ORDER BY updated_at DESC
  `);
  results.threads = threadStmt.all(searchTerm, searchTerm);

  // Build entry search query with optional filters
  // Also search attachment filenames via subquery
  let entryQuery = `
    SELECT e.*, t.title as thread_title
    FROM entries e
    JOIN threads t ON e.thread_id = t.id
    WHERE (
      e.title LIKE ? 
      OR e.content LIKE ? 
      OR e.metadata LIKE ?
      OR EXISTS (
        SELECT 1 FROM attachments a 
        WHERE a.entry_id = e.id AND a.file_name LIKE ?
      )
    )
  `;
  const params = [searchTerm, searchTerm, searchTerm, searchTerm];

  // Filter by entry types if specified
  if (entryTypes && entryTypes.length > 0) {
    const placeholders = entryTypes.map(() => '?').join(', ');
    entryQuery += ` AND e.entry_type IN (${placeholders})`;
    params.push(...entryTypes);
  }

  // Filter by thread if specified
  if (threadId) {
    entryQuery += ' AND e.thread_id = ?';
    params.push(threadId);
  }

  entryQuery += ' ORDER BY e.entry_date DESC';

  const entryStmt = db.prepare(entryQuery);
  const entries = entryStmt.all(...params);

  // For each entry, check if it has matching attachments and include them
  const attachmentStmt = db.prepare(`
    SELECT file_name FROM attachments 
    WHERE entry_id = ? AND file_name LIKE ?
  `);
  
  results.entries = entries.map(entry => {
    const matchingAttachments = attachmentStmt.all(entry.id, searchTerm);
    if (matchingAttachments.length > 0) {
      return {
        ...entry,
        matchingAttachments: matchingAttachments.map(a => a.file_name)
      };
    }
    return entry;
  });

  return results;
}

module.exports = {
  initialize,
  getAllThreads,
  createThread,
  updateThread,
  deleteThread,
  updateThreadOrder,
  getEntriesByThread,
  createEntry,
  updateEntry,
  deleteEntry,
  createAttachment,
  getAttachmentsByEntry,
  getAttachmentById,
  deleteAttachment,
  search,
};
