const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;

function initialize(dataPath) {
  // Use provided path or default to ./data
  const dbDir = dataPath || process.env.DATA_PATH || path.join(process.cwd(), 'data');
  const dbPath = path.join(dbDir, 'dialedger.db');
  
  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      display_order INTEGER DEFAULT 0
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
      db.exec('UPDATE threads SET display_order = id WHERE display_order = 0');
      console.log('Added display_order column to threads table');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }

  // Migration: Update entries table to include 'action_items' in CHECK constraint
  try {
    // Check if the table needs migration by checking the table schema
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
  return dbPath;
}

function getDataPath() {
  return process.env.DATA_PATH || path.join(process.cwd(), 'data');
}

// Thread operations
function getAllThreads() {
  const stmt = db.prepare('SELECT * FROM threads ORDER BY display_order ASC, updated_at DESC');
  return stmt.all();
}

function createThread(data) {
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
  
  const updateStmt = db.prepare('UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  updateStmt.run(data.threadId);
  
  return { id: info.lastInsertRowid, ...data, metadata: metadataString };
}

function updateEntry(data) {
  // Build dynamic UPDATE query based on provided fields
  const updates = [];
  const values = [];
  
  if (data.title !== undefined) {
    updates.push('title = ?');
    values.push(data.title);
  }
  if (data.content !== undefined) {
    updates.push('content = ?');
    values.push(data.content);
  }
  if (data.entryDate !== undefined) {
    updates.push('entry_date = ?');
    values.push(data.entryDate);
  }
  if (data.metadata !== undefined) {
    updates.push('metadata = ?');
    // metadata may already be a string or an object
    const metadataString = typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata);
    values.push(metadataString);
  }
  
  if (updates.length === 0) {
    return data; // Nothing to update
  }
  
  values.push(data.id);
  const stmt = db.prepare(`UPDATE entries SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  
  const entry = db.prepare('SELECT thread_id FROM entries WHERE id = ?').get(data.id);
  if (entry) {
    const updateStmt = db.prepare('UPDATE threads SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(entry.thread_id);
  }
  
  return data;
}

function deleteEntry(id) {
  const entry = db.prepare('SELECT thread_id FROM entries WHERE id = ?').get(id);
  const attachments = db.prepare('SELECT * FROM attachments WHERE entry_id = ?').all(id);
  
  const stmt = db.prepare('DELETE FROM entries WHERE id = ?');
  stmt.run(id);
  
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
  let entryQuery = `
    SELECT e.*, t.title as thread_title
    FROM entries e
    JOIN threads t ON e.thread_id = t.id
    WHERE (e.title LIKE ? OR e.content LIKE ? OR e.metadata LIKE ?)
  `;
  const params = [searchTerm, searchTerm, searchTerm];

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
  results.entries = entryStmt.all(...params);

  return results;
}

module.exports = {
  initialize,
  getDataPath,
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
