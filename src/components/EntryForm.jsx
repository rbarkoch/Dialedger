import React, { useState } from 'react';
import api from '../api';
import './EntryForm.css';

const ENTRY_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'conversation', label: 'Conversation' },
  { value: 'email', label: 'E-Mail' },
  { value: 'file', label: 'File Attachment' },
];

function EntryForm({ onSubmit, onCancel, editEntry = null }) {
  const isEditMode = editEntry !== null;
  
  const [entryType, setEntryType] = useState(editEntry?.entry_type || 'note');
  
  // Get current date/time in local timezone for datetime-local input
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  // Convert date to local datetime string for datetime-local input
  const getLocalDateTime = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  const initialEntryDate = editEntry?.entry_date 
    ? getLocalDateTime(editEntry.entry_date)
    : getCurrentDateTime();
  
  const [entryDate, setEntryDate] = useState(initialEntryDate);
  const [originalEntryDate] = useState(editEntry?.entry_date); // Store original ISO string
  
  // Parse metadata if in edit mode
  const parseMetadata = (metadataString) => {
    try {
      return metadataString ? JSON.parse(metadataString) : {};
    } catch (error) {
      return {};
    }
  };
  
  const metadata = isEditMode ? parseMetadata(editEntry.metadata) : {};

  // Custom title field (optional, user-editable)
  const [customTitle, setCustomTitle] = useState(editEntry?.title || '');

  // Note fields
  const [noteContent, setNoteContent] = useState(metadata.content || '');
  
  // Email fields
  const [emailFrom, setEmailFrom] = useState(metadata.from || '');
  const [emailTo, setEmailTo] = useState(metadata.to || '');
  const [emailCc, setEmailCc] = useState(metadata.cc || '');
  const [emailBcc, setEmailBcc] = useState(metadata.bcc || '');
  const [emailSubject, setEmailSubject] = useState(metadata.subject || '');
  const [emailBody, setEmailBody] = useState(metadata.body || '');
  const [emailAttachments, setEmailAttachments] = useState(metadata.attachments || '');
  
  // Meeting fields
  const [meetingLocation, setMeetingLocation] = useState(metadata.location || '');
  const [meetingAttendees, setMeetingAttendees] = useState(metadata.attendees || '');
  const [meetingDuration, setMeetingDuration] = useState(metadata.duration || '');
  const [meetingNotes, setMeetingNotes] = useState(metadata.notes || '');
  
  // Conversation fields
  const [conversationParticipants, setConversationParticipants] = useState(metadata.participants || '');
  const [conversationLocation, setConversationLocation] = useState(metadata.location || '');
  const [conversationSummary, setConversationSummary] = useState(metadata.summary || '');
  
  // File fields
  const [fileName, setFileName] = useState(metadata.fileName || '');
  const [fileType, setFileType] = useState(metadata.fileType || '');
  const [fileDescription, setFileDescription] = useState(metadata.description || '');
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleBrowseFile = async () => {
    try {
      const file = await api.selectFile();
      console.log('File selected:', file);
      if (file) {
        // Add to the list of selected files
        setSelectedFiles(prev => [...prev, file]);

        // If it's the first file, set the name/type for backwards compatibility
        if (selectedFiles.length === 0) {
          setFileName(file.name);
          setFileType(file.type || 'application/octet-stream');
        }
        console.log('File state updated:', { fileName: file.name, fileType: file.type });
      }
    } catch (error) {
      console.error('Failed to select file:', error);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      // Update fileName and fileType if we removed the first file
      if (index === 0 && newFiles.length > 0) {
        setFileName(newFiles[0].name);
        setFileType(newFiles[0].type || 'application/octet-stream');
      } else if (newFiles.length === 0) {
        setFileName('');
        setFileType('');
      }
      return newFiles;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let newMetadata = {};
    let autoGeneratedTitle = '';

    // Validate and build metadata based on type
    switch (entryType) {
      case 'note':
        if (!noteContent.trim()) {
          alert('Please enter note content');
          return;
        }
        newMetadata = { content: noteContent.trim() };
        autoGeneratedTitle = noteContent.trim().substring(0, 50) + (noteContent.length > 50 ? '...' : '');
        break;

      case 'email':
        if (!emailSubject.trim()) {
          alert('Please enter email subject');
          return;
        }
        newMetadata = {
          from: emailFrom.trim(),
          to: emailTo.trim(),
          cc: emailCc.trim(),
          bcc: emailBcc.trim(),
          subject: emailSubject.trim(),
          body: emailBody.trim(),
          attachments: emailAttachments.trim(),
        };
        autoGeneratedTitle = emailSubject.trim();
        break;

      case 'meeting':
        if (!meetingLocation.trim() && !meetingAttendees.trim()) {
          alert('Please enter meeting location or attendees');
          return;
        }
        newMetadata = {
          location: meetingLocation.trim(),
          attendees: meetingAttendees.trim(),
          duration: meetingDuration.trim(),
          notes: meetingNotes.trim(),
        };
        autoGeneratedTitle = `Meeting${meetingLocation ? ' at ' + meetingLocation : ''}`;
        break;

      case 'conversation':
        if (!conversationParticipants.trim()) {
          alert('Please enter conversation participants');
          return;
        }
        newMetadata = {
          participants: conversationParticipants.trim(),
          location: conversationLocation.trim(),
          summary: conversationSummary.trim(),
        };
        autoGeneratedTitle = `Conversation with ${conversationParticipants.trim()}`;
        break;

      case 'file':
        if (!fileName.trim() && selectedFiles.length === 0) {
          alert('Please enter file name or select at least one file');
          return;
        }
        // Create metadata with file list for multiple files, or single fileName for backwards compatibility
        if (selectedFiles.length > 1) {
          newMetadata = {
            files: selectedFiles.map(f => ({
              fileName: f.name,
              fileType: f.type || 'application/octet-stream'
            })),
            description: fileDescription.trim(),
          };
          autoGeneratedTitle = `${selectedFiles.length} files`;
        } else {
          // Single file or manual entry - use legacy format for backwards compatibility
          newMetadata = {
            fileName: fileName.trim(),
            fileType: fileType.trim(),
            description: fileDescription.trim(),
          };
          autoGeneratedTitle = fileName.trim();
        }
        break;
    }

    // Use custom title if provided, otherwise use auto-generated title
    const finalTitle = customTitle.trim() || autoGeneratedTitle;

    // Determine the entry date to use
    let finalEntryDate;
    if (isEditMode) {
      // Check if user changed the date/time from the original
      const currentLocalDateTime = getLocalDateTime(originalEntryDate);
      if (entryDate === currentLocalDateTime) {
        // User didn't change it, preserve original with full precision
        finalEntryDate = originalEntryDate;
      } else {
        // User manually changed it, use their selection
        finalEntryDate = new Date(entryDate).toISOString();
      }
    } else {
      // New entry: check if user changed the default time
      const defaultDateTime = getCurrentDateTime();
      if (entryDate === defaultDateTime) {
        // User kept the default, use current time with full precision
        finalEntryDate = new Date().toISOString();
      } else {
        // User manually set a different time, use their selection
        finalEntryDate = new Date(entryDate).toISOString();
      }
    }
    
    const entryData = {
      entryType,
      title: finalTitle,
      content: null,
      entryDate: finalEntryDate,
      metadata: newMetadata,
      selectedFiles: selectedFiles, // Pass selected files array
    };
    
    if (isEditMode) {
      entryData.id = editEntry.id;
    }

    console.log('Submitting entry data:', entryData);
    onSubmit(entryData);

    // Reset form only if not in edit mode
    if (!isEditMode) {
      resetForm();
    }
  };
  
  const resetForm = () => {
    setEntryDate(new Date().toISOString().slice(0, 16));
    setCustomTitle('');
    setNoteContent('');
    setEmailFrom('');
    setEmailTo('');
    setEmailCc('');
    setEmailBcc('');
    setEmailSubject('');
    setEmailBody('');
    setEmailAttachments('');
    setMeetingLocation('');
    setMeetingAttendees('');
    setMeetingDuration('');
    setMeetingNotes('');
    setConversationParticipants('');
    setConversationLocation('');
    setConversationSummary('');
    setFileName('');
    setFileType('');
    setFileDescription('');
    setSelectedFiles([]);
  };

  const renderTypeSpecificFields = () => {
    switch (entryType) {
      case 'note':
        return (
          <div className="form-group">
            <label>Note Content *</label>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Enter your note"
              rows="8"
              required
            />
          </div>
        );
        
      case 'email':
        return (
          <>
            <div className="form-group">
              <label>From</label>
              <input
                type="email"
                value={emailFrom}
                onChange={(e) => setEmailFrom(e.target.value)}
                placeholder="sender@example.com"
              />
            </div>
            <div className="form-group">
              <label>To</label>
              <input
                type="text"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>
            <div className="form-group">
              <label>CC</label>
              <input
                type="text"
                value={emailCc}
                onChange={(e) => setEmailCc(e.target.value)}
                placeholder="cc@example.com"
              />
            </div>
            <div className="form-group">
              <label>BCC</label>
              <input
                type="text"
                value={emailBcc}
                onChange={(e) => setEmailBcc(e.target.value)}
                placeholder="bcc@example.com"
              />
            </div>
            <div className="form-group">
              <label>Subject *</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
                required
              />
            </div>
            <div className="form-group">
              <label>Body</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Email content"
                rows="6"
              />
            </div>
            <div className="form-group">
              <label>Attachments</label>
              <input
                type="text"
                value={emailAttachments}
                onChange={(e) => setEmailAttachments(e.target.value)}
                placeholder="file1.pdf, file2.docx (comma-separated)"
              />
            </div>
          </>
        );
        
      case 'meeting':
        return (
          <>
            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                placeholder="Conference Room A, Zoom, etc."
                required
              />
            </div>
            <div className="form-group">
              <label>Attendees</label>
              <input
                type="text"
                value={meetingAttendees}
                onChange={(e) => setMeetingAttendees(e.target.value)}
                placeholder="John, Sarah, Mike (comma-separated)"
              />
            </div>
            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                value={meetingDuration}
                onChange={(e) => setMeetingDuration(e.target.value)}
                placeholder="1 hour, 30 minutes, etc."
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Meeting notes and summary"
                rows="6"
              />
            </div>
          </>
        );
        
      case 'conversation':
        return (
          <>
            <div className="form-group">
              <label>Participants *</label>
              <input
                type="text"
                value={conversationParticipants}
                onChange={(e) => setConversationParticipants(e.target.value)}
                placeholder="Who was involved?"
                required
              />
            </div>
            <div className="form-group">
              <label>Location/Medium</label>
              <input
                type="text"
                value={conversationLocation}
                onChange={(e) => setConversationLocation(e.target.value)}
                placeholder="In-person, phone, Slack, etc."
              />
            </div>
            <div className="form-group">
              <label>Summary</label>
              <textarea
                value={conversationSummary}
                onChange={(e) => setConversationSummary(e.target.value)}
                placeholder="What was discussed?"
                rows="6"
              />
            </div>
          </>
        );
        
      case 'file':
        return (
          <>
            <div className="form-group">
              <label>Select Files</label>
              <button
                type="button"
                onClick={handleBrowseFile}
                className="btn-browse-file"
              >
                {selectedFiles.length === 0 ? 'Browse...' : 'Add Another File...'}
              </button>
              {selectedFiles.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        padding: '0.5rem',
                        backgroundColor: '#f0f4f8',
                        borderRadius: '4px',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', color: '#2c3e50', flex: 1 }}>
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.8rem',
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>File Name *</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="document.pdf (or leave for auto-generated)"
                required={selectedFiles.length === 0}
              />
              <small style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>
                {selectedFiles.length > 0
                  ? 'Leave blank to use auto-generated title based on number of files'
                  : 'Required if no files are selected'}
              </small>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="What are these files about?"
                rows="4"
              />
            </div>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Entry Type</label>
          <select 
            value={entryType} 
            onChange={(e) => setEntryType(e.target.value)}
            disabled={isEditMode}
          >
            {ENTRY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Date & Time</label>
          <input
            type="datetime-local"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="Enter a custom title for this entry"
        />
      </div>

      {renderTypeSpecificFields()}

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-submit">
          {isEditMode ? 'Update Entry' : 'Add Entry'}
        </button>
      </div>
    </form>
  );
}

export default EntryForm;
