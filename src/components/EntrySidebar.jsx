import React, { useState, useEffect, useRef } from 'react';
import Icon from './icons/Icon';
import api from '../api';
import './EntrySidebar.css';

// File item component that loads and displays attachments
const FileItem = ({ entryId, entryTitle, entryDate, onEntryClick, formatDate, onAttachmentsLoaded }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttachments();
  }, [entryId]);

  const loadAttachments = async () => {
    try {
      const result = await api.getAttachmentsByEntry({ entryId });
      setAttachments(result);
      if (onAttachmentsLoaded) {
        onAttachmentsLoaded(result.length);
      }
    } catch (error) {
      console.error('Failed to load attachments:', error);
      if (onAttachmentsLoaded) {
        onAttachmentsLoaded(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId, fileName, e) => {
    e.stopPropagation(); // Prevent navigation when clicking download
    try {
      await api.downloadAttachment({ attachmentId, fileName });
    } catch (error) {
      console.error('Failed to download attachment:', error);
      alert('Failed to download file. The file may have been moved or deleted.');
    }
  };

  if (loading) {
    return null;
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <>
      {attachments.map((attachment) => (
        <li
          key={attachment.id}
          className="sidebar-item sidebar-item-clickable"
          onClick={() => onEntryClick(entryId)}
          title="Click to view entry"
        >
          <div className="sidebar-item-text file-name">
            <Icon name="file" size={14} className="file-icon" />
            <span title={attachment.file_name}>{attachment.file_name}</span>
            <button
              className="btn-download-small"
              onClick={(e) => handleDownloadAttachment(attachment.id, attachment.file_name, e)}
              title="Download file"
            >
              ↓
            </button>
          </div>
          <div className="sidebar-item-meta">
            <span className="sidebar-item-source">{entryTitle}</span>
            <span className="sidebar-item-date">{formatDate(entryDate)}</span>
          </div>
        </li>
      ))}
    </>
  );
};

const EntrySidebar = ({ entries, onToggleActionItem, onEntryNavigate, width, onResize }) => {
  const [fileCount, setFileCount] = useState(0);
  const fileCountRef = useRef({});
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  const handleAttachmentsLoaded = (entryId, count) => {
    fileCountRef.current[entryId] = count;
    const totalCount = Object.values(fileCountRef.current).reduce((sum, c) => sum + c, 0);
    setFileCount(totalCount);
  };

  // Reset file count when entries change
  useEffect(() => {
    fileCountRef.current = {};
    setFileCount(0);
  }, [entries]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !sidebarRef.current) return;

      const sidebar = sidebarRef.current;
      const containerWidth = sidebar.parentElement.offsetWidth;
      const newWidth = containerWidth - e.clientX + sidebar.parentElement.offsetLeft;

      // Constrain width between 200px and 600px
      const constrainedWidth = Math.min(Math.max(newWidth, 200), 600);

      if (onResize) {
        onResize(constrainedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onResize]);

  // Extract incomplete action items with their entry context
  const incompleteActionItems = [];

  // Extract all entries (FileItem component will filter entries with attachments)
  const fileEntries = [];

  // Process entries in order
  entries.forEach((entry) => {
    if (entry.entry_type === 'action_items') {
      try {
        const metadata = typeof entry.metadata === 'string'
          ? JSON.parse(entry.metadata)
          : entry.metadata;

        if (metadata.items && Array.isArray(metadata.items)) {
          metadata.items.forEach((item, index) => {
            if (!item.completed) {
              incompleteActionItems.push({
                entryId: entry.id,
                entryTitle: entry.title || metadata.description || 'Action Items',
                entryDate: entry.entry_date,
                text: item.text,
                itemIndex: index
              });
            }
          });
        }
      } catch (e) {
        console.error('Error parsing action items metadata:', e);
      }
    }

    // Show all entries - FileItem will only render if the entry has attachments
    try {
      const metadata = typeof entry.metadata === 'string'
        ? JSON.parse(entry.metadata)
        : entry.metadata || {};

      fileEntries.push({
        entryId: entry.id,
        entryTitle: entry.title || metadata.description || metadata.fileName || 'File',
        entryDate: entry.entry_date
      });
    } catch (e) {
      console.error('Error parsing entry metadata:', e);
    }
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleActionItemClick = (entryId) => {
    if (onEntryNavigate) {
      onEntryNavigate(entryId);
    }
  };

  const handleToggle = (entryId, itemIndex, e) => {
    e.stopPropagation(); // Prevent navigation when toggling
    if (onToggleActionItem) {
      onToggleActionItem(entryId, itemIndex);
    }
  };

  return (
    <div
      className="entry-sidebar"
      ref={sidebarRef}
      style={{
        width: `${width}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`
      }}
    >
      <div
        className="sidebar-resize-handle"
        onMouseDown={handleMouseDown}
      />
      {/* Action Items Section */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <Icon name="action_items" size={18} />
          <h3>Action Items</h3>
          <span className="sidebar-count">{incompleteActionItems.length}</span>
        </div>

        <div className="sidebar-section-content">
          {incompleteActionItems.length === 0 ? (
            <div className="sidebar-empty">No incomplete action items</div>
          ) : (
            <ul className="sidebar-list">
              {incompleteActionItems.map((item, idx) => (
                <li
                  key={`${item.entryId}-${item.itemIndex}`}
                  className="sidebar-item sidebar-item-clickable"
                  onClick={() => handleActionItemClick(item.entryId)}
                  title="Click to view entry"
                >
                  <div className="sidebar-item-action">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={(e) => handleToggle(item.entryId, item.itemIndex, e)}
                      onClick={(e) => e.stopPropagation()}
                      title="Mark as complete"
                    />
                    <div className="sidebar-item-text">{item.text}</div>
                  </div>
                  <div className="sidebar-item-meta">
                    <span className="sidebar-item-source">{item.entryTitle}</span>
                    <span className="sidebar-item-date">{formatDate(item.entryDate)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Files Section */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <Icon name="file" size={18} />
          <h3>Files</h3>
          <span className="sidebar-count">{fileCount}</span>
        </div>

        <div className="sidebar-section-content">
          {fileCount === 0 && fileEntries.length > 0 ? (
            <div className="sidebar-empty">Loading files...</div>
          ) : fileCount === 0 ? (
            <div className="sidebar-empty">No files</div>
          ) : (
            <ul className="sidebar-list">
              {fileEntries.map((fileEntry) => (
                <FileItem
                  key={fileEntry.entryId}
                  entryId={fileEntry.entryId}
                  entryTitle={fileEntry.entryTitle}
                  entryDate={fileEntry.entryDate}
                  onEntryClick={onEntryNavigate}
                  formatDate={formatDate}
                  onAttachmentsLoaded={(count) => handleAttachmentsLoaded(fileEntry.entryId, count)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntrySidebar;
