import React, { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Icon from './icons/Icon';
import './ThreadList.css';

function SortableThreadItem({ thread, selectedThread, onSelectThread, onEditThread, onDeleteThread }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: thread.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`thread-item ${selectedThread?.id === thread.id ? 'active' : ''}`}
      onClick={() => onSelectThread(thread)}
    >
      <div className="thread-drag-handle" {...attributes} {...listeners}>
        <span className="drag-indicator">⋮⋮</span>
      </div>
      <div className="thread-item-content">
        <h3>{thread.title}</h3>
        {thread.description && <p>{thread.description}</p>}
      </div>
      <div className="thread-item-actions">
        <button
          className="btn-edit"
          onClick={(e) => onEditThread(e, thread)}
          title="Edit thread"
        >
          <Icon name="edit" size={16} />
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
          <Icon name="delete" size={16} />
        </button>
      </div>
    </div>
  );
}

function ThreadList({ threads, selectedThread, onSelectThread, onCreateThread, onDeleteThread, onUpdateThread, onReorderThreads }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
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

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = threads.findIndex((t) => t.id === active.id);
      const newIndex = threads.findIndex((t) => t.id === over.id);

      const reordered = arrayMove(threads, oldIndex, newIndex);
      onReorderThreads(reordered);
    }
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
          {showNewThreadForm && !editingThread ? (
            <Icon name="close" size={18} />
          ) : (
            <Icon name="plus" size={18} />
          )}
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={threads.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {threads.map((thread) => (
                <SortableThreadItem
                  key={thread.id}
                  thread={thread}
                  selectedThread={selectedThread}
                  onSelectThread={onSelectThread}
                  onEditThread={handleEditThread}
                  onDeleteThread={onDeleteThread}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

export default ThreadList;
