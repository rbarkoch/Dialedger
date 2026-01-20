import React, { useState, useEffect, useRef } from 'react';
import EntryList from './EntryList';
import EntryForm from './EntryForm';
import EntrySidebar from './EntrySidebar';
import api, { isElectron } from '../api';
import './ThreadView.css';

function ThreadView({ thread, onThreadUpdated, highlightedEntryId }) {
  const [entries, setEntries] = useState([]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [newEntryId, setNewEntryId] = useState(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (thread) {
      loadEntries();
    } else {
      setEntries([]);
    }
  }, [thread]);

  // Auto-scroll to bottom when entries change (but not when highlighting)
  useEffect(() => {
    if (contentRef.current && entries.length > 0 && !highlightedEntryId) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [entries, highlightedEntryId]);

  // Scroll to highlighted entry from search
  useEffect(() => {
    if (highlightedEntryId && contentRef.current) {
      const entryElement = document.getElementById(`entry-${highlightedEntryId}`);
      if (entryElement) {
        entryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedEntryId, entries]);

  const loadEntries = async () => {
    if (!thread) return;
    
    setLoading(true);
    try {
      const threadEntries = await api.getEntriesByThread({ threadId: thread.id });
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
        await api.updateEntry(entryData);
        setNewEntryId(null); // Clear animation for edits
      } else {
        // Create new entry
        const entry = await api.createEntry({
          threadId: thread.id,
          entryType: entryData.entryType,
          title: entryData.title,
          content: entryData.content,
          entryDate: entryData.entryDate,
          metadata: entryData.metadata,
        });
        
        // Mark this as the new entry for animation
        setNewEntryId(entry.id);

        // If there are selected file attachments, save them before reloading
        if (entryData.selectedFiles && entryData.selectedFiles.length > 0 && entryData.entryType === 'file') {
          console.log('Saving attachments for entry ID:', entry.id);
          for (const file of entryData.selectedFiles) {
            const savedAttachment = await api.saveAttachment({
              filePath: file.path,
              fileName: file.name,
              file: file.file, // For web upload
              entryId: entry.id,
            });
            console.log('Attachment saved successfully:', savedAttachment);
          }
        }

        // Clear the animation after 1s (animation duration)
        setTimeout(() => setNewEntryId(null), 1000);
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
      await api.deleteEntry({ id: entryId });
      await loadEntries();
      onThreadUpdated();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const handleToggleActionItem = async (entryId, itemIndex) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;
      
      const metadata = entry.metadata ? JSON.parse(entry.metadata) : {};
      if (!metadata.items || !metadata.items[itemIndex]) return;
      
      // Toggle the completed status
      metadata.items[itemIndex].completed = !metadata.items[itemIndex].completed;
      
      // Update the entry
      await api.updateEntry({
        id: entryId,
        metadata: JSON.stringify(metadata),
      });
      
      // Reload entries to reflect the change
      await loadEntries();
    } catch (error) {
      console.error('Failed to toggle action item:', error);
    }
  };

  const handleReorderActionItems = async (entryId, fromIndex, toIndex) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;
      
      const metadata = entry.metadata ? JSON.parse(entry.metadata) : {};
      if (!metadata.items || metadata.items.length < 2) return;
      
      // Reorder the items
      const items = [...metadata.items];
      const [movedItem] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, movedItem);
      metadata.items = items;
      
      // Update the entry
      await api.updateEntry({
        id: entryId,
        metadata: JSON.stringify(metadata),
      });
      
      // Reload entries to reflect the change
      await loadEntries();
    } catch (error) {
      console.error('Failed to reorder action items:', error);
    }
  };

  const handleUpdateActionItemText = async (entryId, itemIndex, newText) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;
      
      const metadata = entry.metadata ? JSON.parse(entry.metadata) : {};
      if (!metadata.items || !metadata.items[itemIndex]) return;
      
      // Update the text
      metadata.items[itemIndex].text = newText;
      
      // Update the entry
      await api.updateEntry({
        id: entryId,
        metadata: JSON.stringify(metadata),
      });
      
      // Reload entries to reflect the change
      await loadEntries();
    } catch (error) {
      console.error('Failed to update action item text:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only show drag overlay if there are files being dragged
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
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
          // Parse the .eml file - in web mode, pass the File object; in Electron, pass the path
          const parsed = await api.parseEmlFile(isElectron ? file.path : file);
          
          // Create email entry
          await api.createEntry({
            threadId: thread.id,
            entryType: 'email',
            title: parsed.subject,
            content: null,
            entryDate: new Date(parsed.date).toISOString(),
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
          const entry = await api.createEntry({
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
          await api.saveAttachment({
            filePath: isElectron ? file.path : undefined,
            fileName: file.name,
            file: isElectron ? undefined : file, // For web upload
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

      <div className="thread-view-main">
        <div className="thread-view-content" ref={contentRef}>
          {loading ? (
            <div className="loading-entries">Loading entries...</div>
          ) : (
            <EntryList
              entries={entries}
              onDeleteEntry={handleDeleteEntry}
              onEditEntry={handleEditEntry}
              onToggleActionItem={handleToggleActionItem}
              onReorderActionItems={handleReorderActionItems}
              onUpdateActionItemText={handleUpdateActionItemText}
              newEntryId={newEntryId}
              highlightedEntryId={highlightedEntryId}
            />
          )}
        </div>
        <EntrySidebar entries={entries} />
      </div>
    </div>
  );
}

export default ThreadView;
