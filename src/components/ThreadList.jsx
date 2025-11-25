import React, { useState } from 'react';
import './ThreadList.css';

function ThreadList({ threads, selectedThread, onSelectThread, onCreateThread, onDeleteThread, onUpdateThread }) {
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [editingThread, setEditingThread] = useState(null);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadDescription, setNewThreadDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newThreadTitle.trim()) {
      if (editingThread) {
        // Update existing thread
        onUpdateThread(editingThread.id, newThreadTitle, newThreadDescription);
        setEditingThread(null);
      } else {
        // Create new thread
        onCreateThread(newThreadTitle, newThreadDescription);
      }
      setNewThreadTitle('');
      setNewThreadDescription('');
      setShowNewThreadForm(false);
    }
  };

  const handleEditThread = (e, thread) => {
    e.stopPropagation();
    setEditingThread(thread);
    setNewThreadTitle(thread.title);
    setNewThreadDescription(thread.description || '');
    setShowNewThreadForm(true);
  };

  const handleCancelForm = () => {
    setShowNewThreadForm(false);
    setEditingThread(null);
    setNewThreadTitle('');
    setNewThreadDescription('');
  };

  return (
    <div className="thread-list">
      <div className="thread-list-header">
        <h2>Threads</h2>
        <button
          className="btn-new-thread"
          onClick={() => {
            setShowNewThreadForm(!showNewThreadForm);
            setEditingThread(null);
            setNewThreadTitle('');
            setNewThreadDescription('');
          }}
        >
          {showNewThreadForm && !editingThread ? '✕' : '+'}
        </button>
      </div>

      {showNewThreadForm && (
        <form className="new-thread-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Thread title"
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
            autoFocus
          />
          <textarea
            placeholder="Description (optional)"
            value={newThreadDescription}
            onChange={(e) => setNewThreadDescription(e.target.value)}
            rows="3"
          />
          <div className="form-buttons">
            <button type="button" onClick={handleCancelForm} className="btn-cancel-form">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              {editingThread ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div className="thread-items">
        {threads.length === 0 ? (
          <div className="empty-state">
            No threads yet. Create one to get started!
          </div>
        ) : (
          threads.map((thread) => (
            <div
              key={thread.id}
              className={`thread-item ${selectedThread?.id === thread.id ? 'active' : ''}`}
              onClick={() => onSelectThread(thread)}
            >
              <div className="thread-item-content">
                <h3>{thread.title}</h3>
                {thread.description && <p>{thread.description}</p>}
              </div>
              <div className="thread-item-actions">
                <button
                  className="btn-edit"
                  onClick={(e) => handleEditThread(e, thread)}
                  title="Edit thread"
                >
                  ✏️
                </button>
                <button
                  className="btn-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete thread "${thread.title}"?`)) {
                      onDeleteThread(thread.id);
                    }
                  }}
                  title="Delete thread"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ThreadList;
