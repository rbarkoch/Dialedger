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
        // Update existing entry
        await window.electronAPI.updateEntry(entryData);
      } else {
        // Create new entry
        await window.electronAPI.createEntry({
          threadId: thread.id,
          ...entryData,
        });
      }
      await loadEntries();
      onThreadUpdated();
      setShowEntryForm(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Failed to save entry:', error);
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
    const emlFiles = files.filter(file => file.name.toLowerCase().endsWith('.eml'));

    if (emlFiles.length === 0) {
      alert('Please drop .eml files only');
      return;
    }

    for (const file of emlFiles) {
      try {
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
            subject: parsed.subject,
            body: parsed.body,
          },
        });
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        alert(`Failed to process ${file.name}. Please check the file format.`);
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
            <span className="drop-icon">📧</span>
            <p>Drop .eml files here to add email entries</p>
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
