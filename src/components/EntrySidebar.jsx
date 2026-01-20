import React from 'react';
import './EntrySidebar.css';

const EntrySidebar = ({ entries }) => {
  // Extract incomplete action items with their entry context
  const incompleteActionItems = [];

  // Extract files with their entry context
  const allFiles = [];

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
    } else if (entry.entry_type === 'file') {
      try {
        const metadata = typeof entry.metadata === 'string'
          ? JSON.parse(entry.metadata)
          : entry.metadata;

        if (metadata.files && Array.isArray(metadata.files)) {
          metadata.files.forEach((file) => {
            allFiles.push({
              entryId: entry.id,
              entryTitle: entry.title || metadata.description || 'File',
              entryDate: entry.entry_date,
              fileName: file.fileName,
              fileType: file.fileType
            });
          });
        }
      } catch (e) {
        console.error('Error parsing file metadata:', e);
      }
    }
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="entry-sidebar">
      {/* Action Items Section */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="sidebar-icon">☑️</span>
          <h3>Action Items</h3>
          <span className="sidebar-count">{incompleteActionItems.length}</span>
        </div>

        <div className="sidebar-section-content">
          {incompleteActionItems.length === 0 ? (
            <div className="sidebar-empty">No incomplete action items</div>
          ) : (
            <ul className="sidebar-list">
              {incompleteActionItems.map((item, idx) => (
                <li key={`${item.entryId}-${item.itemIndex}`} className="sidebar-item">
                  <div className="sidebar-item-text">{item.text}</div>
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
          <span className="sidebar-icon">📄</span>
          <h3>Files</h3>
          <span className="sidebar-count">{allFiles.length}</span>
        </div>

        <div className="sidebar-section-content">
          {allFiles.length === 0 ? (
            <div className="sidebar-empty">No files</div>
          ) : (
            <ul className="sidebar-list">
              {allFiles.map((file, idx) => (
                <li key={`${file.entryId}-${idx}`} className="sidebar-item">
                  <div className="sidebar-item-text file-name">
                    <span className="file-icon">📎</span>
                    {file.fileName}
                  </div>
                  <div className="sidebar-item-meta">
                    <span className="sidebar-item-source">{file.entryTitle}</span>
                    <span className="sidebar-item-date">{formatDate(file.entryDate)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntrySidebar;
