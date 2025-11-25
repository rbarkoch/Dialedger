import React, { useState, useEffect } from 'react';
import EntryList from './EntryList';
import EntryForm from './EntryForm';
import './ThreadView.css';

function ThreadView({ thread, onThreadUpdated }) {
  const [entries, setEntries] = useState([]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [loading, setLoading] = useState(false);

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
    <div className="thread-view">
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
