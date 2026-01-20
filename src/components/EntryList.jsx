import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import api from '../api';
import Icon from './icons/Icon';
import './EntryList.css';

function FileAttachmentDisplay({ entryId }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttachments();
  }, [entryId]);

  const loadAttachments = async () => {
    try {
      console.log('Loading attachments for entry:', entryId);
      const result = await api.getAttachmentsByEntry({ entryId });
      console.log('Attachments loaded:', result);
      setAttachments(result);
    } catch (error) {
      console.error('Failed to load attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      await api.downloadAttachment({ attachmentId, fileName });
    } catch (error) {
      console.error('Failed to download attachment:', error);
      alert('Failed to download file. The file may have been moved or deleted.');
    }
  };

  if (loading) {
    return <div className="attachment-loading">Loading attachments...</div>;
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="attachment-list">
      {attachments.map(attachment => (
        <button
          key={attachment.id}
          className="btn-attachment"
          onClick={() => handleDownloadAttachment(attachment.id, attachment.file_name)}
          title={`Download ${attachment.file_name}`}
        >
          <Icon name="file" size={16} />
          <span>{attachment.file_name}</span>
          {attachment.file_size && (
            <span className="attachment-size">
              ({(attachment.file_size / 1024).toFixed(1)} KB)
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function EntryList({ entries, onDeleteEntry, onEditEntry, onToggleActionItem, onReorderActionItems, onUpdateActionItemText, newEntryId, highlightedEntryId }) {
  const [expandedEntries, setExpandedEntries] = useState(new Set());
  const [draggedItem, setDraggedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingText, setEditingText] = useState('');

  const toggleExpanded = (entryId) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  if (entries.length === 0) {
    return (
      <div className="empty-entries">
        No entries yet. Add an entry to start building your conversation thread!
      </div>
    );
  }

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const getEntryTypeLabel = (type) => {
    const labels = {
      note: 'Note',
      meeting: 'Meeting',
      conversation: 'Conversation',
      email: 'E-Mail',
      file: 'File Attachment',
      action_items: 'Action Items',
    };
    return labels[type] || type;
  };

  const parseMetadata = (metadataString) => {
    try {
      return metadataString ? JSON.parse(metadataString) : {};
    } catch (error) {
      return {};
    }
  };

  const renderEntryContent = (entry) => {
    const metadata = parseMetadata(entry.metadata);
    const isExpanded = expandedEntries.has(entry.id);

    switch (entry.entry_type) {
      case 'note':
        const hasMoreNote = metadata.content && metadata.content.length > 300;
        return (
          <div className="entry-content">
            <div className={`entry-text markdown-content ${isExpanded ? 'expanded' : 'collapsed'} ${hasMoreNote && !isExpanded ? 'has-more' : ''}`}>
              <ReactMarkdown>{metadata.content}</ReactMarkdown>
            </div>
            {hasMoreNote && (
              <button className="btn-expand" onClick={() => toggleExpanded(entry.id)}>
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        );

      case 'email':
        return (
          <div className="entry-content">
            <h3 className="entry-title">{metadata.subject}</h3>
            {(metadata.from || metadata.to || metadata.cc || metadata.bcc) && (
              <div className="entry-metadata">
                {metadata.from && <div className="metadata-item"><strong>From:</strong> {metadata.from}</div>}
                {metadata.to && <div className="metadata-item"><strong>To:</strong> {metadata.to}</div>}
                {metadata.cc && <div className="metadata-item"><strong>CC:</strong> {metadata.cc}</div>}
                {metadata.bcc && <div className="metadata-item"><strong>BCC:</strong> {metadata.bcc}</div>}
              </div>
            )}
            {metadata.body && (
              <>
                {(() => {
                  const hasMoreBody = metadata.body.length > 300;
                  return (
                    <>
                      <div className={`entry-text markdown-content ${isExpanded ? 'expanded' : 'collapsed'} ${hasMoreBody && !isExpanded ? 'has-more' : ''}`}>
                        <ReactMarkdown>{metadata.body}</ReactMarkdown>
                      </div>
                      {hasMoreBody && (
                        <button className="btn-expand" onClick={() => toggleExpanded(entry.id)}>
                          {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </>
                  );
                })()}
              </>
            )}
            {metadata.attachments && metadata.attachments.length > 0 && (
              <div className="entry-metadata">
                <div className="metadata-item">
                  <strong>Attachments:</strong>{' '}
                  {typeof metadata.attachments === 'string' 
                    ? metadata.attachments 
                    : metadata.attachments.map(a => a.filename).join(', ')}
                </div>
              </div>
            )}
          </div>
        );

      case 'meeting':
        return (
          <div className="entry-content">
            <h3 className="entry-title">Meeting at {metadata.location}</h3>
            {(metadata.attendees || metadata.duration) && (
              <div className="entry-metadata">
                {metadata.attendees && <div className="metadata-item"><strong>Attendees:</strong> {metadata.attendees}</div>}
                {metadata.duration && <div className="metadata-item"><strong>Duration:</strong> {metadata.duration}</div>}
              </div>
            )}
            {metadata.notes && (
              <>
                {(() => {
                  const hasMoreNotes = metadata.notes.length > 300;
                  return (
                    <>
                      <div className={`entry-text markdown-content ${isExpanded ? 'expanded' : 'collapsed'} ${hasMoreNotes && !isExpanded ? 'has-more' : ''}`}>
                        <ReactMarkdown>{metadata.notes}</ReactMarkdown>
                      </div>
                      {hasMoreNotes && (
                        <button className="btn-expand" onClick={() => toggleExpanded(entry.id)}>
                          {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        );

      case 'conversation':
        return (
          <div className="entry-content">
            <h3 className="entry-title">Conversation with {metadata.participants}</h3>
            {metadata.location && (
              <div className="entry-metadata">
                <div className="metadata-item"><strong>Medium:</strong> {metadata.location}</div>
              </div>
            )}
            {metadata.summary && (
              <>
                {(() => {
                  const hasMoreSummary = metadata.summary.length > 300;
                  return (
                    <>
                      <div className={`entry-text markdown-content ${isExpanded ? 'expanded' : 'collapsed'} ${hasMoreSummary && !isExpanded ? 'has-more' : ''}`}>
                        <ReactMarkdown>{metadata.summary}</ReactMarkdown>
                      </div>
                      {hasMoreSummary && (
                        <button className="btn-expand" onClick={() => toggleExpanded(entry.id)}>
                          {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="entry-content">
            <h3 className="entry-title">{metadata.fileName}</h3>
            {metadata.description && (
              <>
                {(() => {
                  const hasMoreDesc = metadata.description.length > 300;
                  return (
                    <>
                      <div className={`entry-text markdown-content ${isExpanded ? 'expanded' : 'collapsed'} ${hasMoreDesc && !isExpanded ? 'has-more' : ''}`}>
                        <ReactMarkdown>{metadata.description}</ReactMarkdown>
                      </div>
                      {hasMoreDesc && (
                        <button className="btn-expand" onClick={() => toggleExpanded(entry.id)}>
                          {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </>
                  );
                })()}
              </>
            )}
            <FileAttachmentDisplay key={`attachment-${entry.id}`} entryId={entry.id} />
          </div>
        );

      case 'action_items':
        return (
          <div className="entry-content">
            {metadata.description && (
              <div className="entry-text markdown-content" style={{ marginBottom: '1rem' }}>
                <ReactMarkdown>{metadata.description}</ReactMarkdown>
              </div>
            )}
            {metadata.items && metadata.items.length > 0 && (
              <div className="action-items-list" style={{ marginTop: '0.5rem' }}>
                {metadata.items.map((item, index) => {
                  const isEditing = editingItem?.entryId === entry.id && editingItem?.index === index;
                  const isDragging = draggedItem?.entryId === entry.id && draggedItem?.index === index;
                  return (
                    <div
                      key={index}
                      draggable={!isEditing}
                      onDragStart={(e) => {
                        if (isEditing) return;
                        setDraggedItem({ entryId: entry.id, index });
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => setDraggedItem(null)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedItem && draggedItem.entryId === entry.id && draggedItem.index !== index) {
                          onReorderActionItems && onReorderActionItems(entry.id, draggedItem.index, index);
                        }
                        setDraggedItem(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        padding: '0.5rem 0',
                        borderBottom: index < metadata.items.length - 1 ? '1px solid #ecf0f1' : 'none',
                        cursor: isEditing ? 'default' : 'grab',
                        backgroundColor: isDragging ? '#f0f0f0' : 'transparent',
                        opacity: isDragging ? 0.5 : 1,
                      }}
                    >
                      <span
                        style={{
                          color: '#bdc3c7',
                          cursor: 'grab',
                          userSelect: 'none',
                        }}
                        title="Drag to reorder"
                      >
                        ⋮⋮
                      </span>
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => onToggleActionItem && onToggleActionItem(entry.id, index)}
                        style={{
                          marginTop: '0.25rem',
                          cursor: 'pointer',
                        }}
                      />
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (editingText.trim() && onUpdateActionItemText) {
                                  onUpdateActionItemText(entry.id, index, editingText.trim());
                                }
                                setEditingItem(null);
                                setEditingText('');
                              } else if (e.key === 'Escape') {
                                setEditingItem(null);
                                setEditingText('');
                              }
                            }}
                            onBlur={() => {
                              if (editingText.trim() && onUpdateActionItemText) {
                                onUpdateActionItemText(entry.id, index, editingText.trim());
                              }
                              setEditingItem(null);
                              setEditingText('');
                            }}
                            autoFocus
                            style={{
                              flex: 1,
                              padding: '0.25rem 0.5rem',
                              border: '1px solid #3498db',
                              borderRadius: '4px',
                              outline: 'none',
                              fontSize: 'inherit',
                            }}
                          />
                        </>
                      ) : (
                        <span
                          onClick={() => {
                            setEditingItem({ entryId: entry.id, index });
                            setEditingText(item.text);
                          }}
                          style={{
                            flex: 1,
                            textDecoration: item.completed ? 'line-through' : 'none',
                            color: item.completed ? '#95a5a6' : '#2c3e50',
                            cursor: 'text',
                          }}
                          title="Click to edit"
                        >
                          {item.text}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="entry-content">
            {entry.title && <h3 className="entry-title">{entry.title}</h3>}
            {entry.content && <p className="entry-text">{entry.content}</p>}
          </div>
        );
    }
  };

  return (
    <div className="entry-list">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          id={`entry-${entry.id}`}
          className={`entry-item ${entry.id === newEntryId ? 'entry-new' : ''} ${entry.id === highlightedEntryId ? 'entry-highlighted' : ''}`}
          data-entry-id={entry.id}
        >
          <div className="entry-header">
            <div className="entry-type">
              <span className="entry-icon">
                <Icon name={entry.entry_type} size={20} />
              </span>
              <span className="entry-type-label">{getEntryTypeLabel(entry.entry_type)}</span>
              {entry.title && <span className="entry-title-header">— {entry.title}</span>}
            </div>
            <div className="entry-header-right">
              <div className="entry-date">{formatDate(entry.entry_date)}</div>
              <div className="entry-actions">
                <button
                  className="btn-icon-edit"
                  onClick={() => onEditEntry(entry)}
                  title="Edit entry"
                >
                  <Icon name="edit" size={16} />
                </button>
                <button
                  className="btn-icon-delete"
                  onClick={() => {
                    if (confirm('Delete this entry?')) {
                      onDeleteEntry(entry.id);
                    }
                  }}
                  title="Delete entry"
                >
                  <Icon name="delete" size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {renderEntryContent(entry)}
        </div>
      ))}
    </div>
  );
}

export default EntryList;
