import React from 'react';
import { format } from 'date-fns';
import Icon from './icons/Icon';
import './EntryList.css';

function EntryList({ entries, onDeleteEntry, onEditEntry }) {
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

    switch (entry.entry_type) {
      case 'note':
        return (
          <div className="entry-content">
            <p className="entry-text">{metadata.content}</p>
          </div>
        );

      case 'email':
        return (
          <div className="entry-content">
            <h3 className="entry-title">{metadata.subject}</h3>
            {(metadata.from || metadata.to) && (
              <div className="entry-metadata">
                {metadata.from && <div className="metadata-item"><strong>From:</strong> {metadata.from}</div>}
                {metadata.to && <div className="metadata-item"><strong>To:</strong> {metadata.to}</div>}
              </div>
            )}
            {metadata.body && <p className="entry-text">{metadata.body}</p>}
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
            {metadata.notes && <p className="entry-text">{metadata.notes}</p>}
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
            {metadata.summary && <p className="entry-text">{metadata.summary}</p>}
          </div>
        );

      case 'file':
        return (
          <div className="entry-content">
            <h3 className="entry-title">{metadata.fileName}</h3>
            {metadata.fileType && (
              <div className="entry-metadata">
                <div className="metadata-item"><strong>Type:</strong> {metadata.fileType}</div>
              </div>
            )}
            {metadata.description && <p className="entry-text">{metadata.description}</p>}
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
        <div key={entry.id} className="entry-item">
          <div className="entry-header">
            <div className="entry-type">
              <span className="entry-icon">
                <Icon name={entry.entry_type} size={20} />
              </span>
              <span className="entry-type-label">{getEntryTypeLabel(entry.entry_type)}</span>
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
