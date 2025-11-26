import React, { useState, useEffect } from 'react';
import EntryList from './EntryList';
import EntryForm from './EntryForm';
import './ThreadView.css';

function ThreadView({ thread, onThreadUpdated }) {
  const [entries, setEntries] = useState([]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (thread) {
      loadEntries();
    } else {
      setEntries([]);
    }
  }, [thread]);

  const loadEntries = async () => {
    if (!thread) return;
    
    setLoading(true);
    try {
      const threadEntries = await window.electronAPI.getEntriesByThread({ threadId: thread.id });
      setEntries(threadEntries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async (entryData) => {
    try {
      if (entryData.id) {
        // Update existing entry - entryDate is already handled in EntryForm
        await window.electronAPI.updateEntry(entryData);
      } else {
        // Create new entry
        const entry = await window.electronAPI.createEntry({
          threadId: thread.id,
          entryType: entryData.entryType,
          title: entryData.title,
          content: entryData.content,
          entryDate: entryData.entryDate,
          metadata: entryData.metadata,
        });
        
        // If there's a selected file attachment, save it before reloading
        if (entryData.selectedFile && entryData.entryType === 'file') {
          console.log('Saving attachment for entry ID:', entry.id);
          const savedAttachment = await window.electronAPI.saveAttachment({
            filePath: entryData.selectedFile.path,
            fileName: entryData.selectedFile.name,
            entryId: entry.id,
          });
          console.log('Attachment saved successfully:', savedAttachment);
        }
      }
      // Reload entries after attachment is saved
      await loadEntries();
      onThreadUpdated();
      setShowEntryForm(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Failed to save entry:', error);
      alert(`Failed to save entry: ${error.message}`);
    }
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
  };
  
  const handleCancelEdit = () => {
    setShowEntryForm(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      await window.electronAPI.deleteEntry({ id: entryId });
      await loadEntries();
      onThreadUpdated();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!thread) return;

    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) {
      return;
    }

    for (const file of files) {
      try {
        // Check if it's an .eml file
        if (file.name.toLowerCase().endsWith('.eml')) {
          // Parse the .eml file
          const parsed = await window.electronAPI.parseEmlFile(file.path);
          
          // Create email entry
          await window.electronAPI.createEntry({
            threadId: thread.id,
            entryType: 'email',
            title: parsed.subject,
            content: null,
            entryDate: parsed.date.toISOString(),
            metadata: {
              from: parsed.from,
              to: parsed.to,
              cc: parsed.cc,
              bcc: parsed.bcc,
              subject: parsed.subject,
              body: parsed.body,
              attachments: parsed.attachments,
            },
          });
        } else {
          // Create file attachment entry
          const entry = await window.electronAPI.createEntry({
            threadId: thread.id,
            entryType: 'file',
            title: file.name,
            content: null,
            entryDate: new Date().toISOString(),
            metadata: {
              fileName: file.name,
              fileType: file.type || 'application/octet-stream',
              description: '',
            },
          });
          
          // Save the actual file
          await window.electronAPI.saveAttachment({
            filePath: file.path,
            fileName: file.name,
            entryId: entry.id,
          });
        }
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        alert(`Failed to process ${file.name}. Error: ${error.message}`);
      }
    }

    // Reload entries and update thread
    await loadEntries();
    onThreadUpdated();
  };

  if (!thread) {
    return (
      <div className="thread-view">
        <div className="empty-thread-view">
          Select a thread to view its entries
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`thread-view ${isDragging ? 'dragging-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="drop-overlay">
          <div className="drop-message">
            <span className="drop-icon">📎</span>
            <p>Drop files here</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.9 }}>
              .eml files will be parsed as emails, others will be saved as attachments
            </p>
          </div>
        </div>
      )}

      <div className="thread-view-header">
        <div className="thread-info">
          <h1>{thread.title}</h1>
          {thread.description && <p>{thread.description}</p>}
        </div>
        <button
          className="btn-add-entry"
          onClick={() => {
            setShowEntryForm(!showEntryForm);
            setEditingEntry(null);
          }}
        >
          {showEntryForm && !editingEntry ? 'Cancel' : '+ Add Entry'}
        </button>
      </div>

      {showEntryForm && (
        <EntryForm
          onSubmit={handleCreateEntry}
          onCancel={handleCancelEdit}
          editEntry={editingEntry}
        />
      )}

      <div className="thread-view-content">
        {loading ? (
          <div className="loading-entries">Loading entries...</div>
        ) : (
          <EntryList
            entries={entries}
            onDeleteEntry={handleDeleteEntry}
            onEditEntry={handleEditEntry}
          />
        )}
      </div>
    </div>
  );
}

export default ThreadView;
