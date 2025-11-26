import React, { useState } from 'react';
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
  
  const [entryDate, setEntryDate] = useState(
    editEntry?.entry_date 
      ? new Date(editEntry.entry_date).toISOString().slice(0, 16)
      : getCurrentDateTime()
  );
  
  // Parse metadata if in edit mode
  const parseMetadata = (metadataString) => {
    try {
      return metadataString ? JSON.parse(metadataString) : {};
    } catch (error) {
      return {};
    }
  };
  
  const metadata = isEditMode ? parseMetadata(editEntry.metadata) : {};
  
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
  const [selectedFile, setSelectedFile] = useState(null);

  const handleBrowseFile = async () => {
    try {
      const file = await window.electronAPI.selectFile();
      console.log('File selected:', file);
      if (file) {
        setSelectedFile(file);
        setFileName(file.name);
        setFileType(file.type || 'application/octet-stream');
        console.log('File state updated:', { fileName: file.name, fileType: file.type });
      }
    } catch (error) {
      console.error('Failed to select file:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let newMetadata = {};
    let title = '';
    
    // Validate and build metadata based on type
    switch (entryType) {
      case 'note':
        if (!noteContent.trim()) {
          alert('Please enter note content');
          return;
        }
        newMetadata = { content: noteContent.trim() };
        title = noteContent.trim().substring(0, 50) + (noteContent.length > 50 ? '...' : '');
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
        title = emailSubject.trim();
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
        title = `Meeting${meetingLocation ? ' at ' + meetingLocation : ''}`;
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
        title = `Conversation with ${conversationParticipants.trim()}`;
        break;
        
      case 'file':
        if (!fileName.trim()) {
          alert('Please enter file name or select a file');
          return;
        }
        newMetadata = {
          fileName: fileName.trim(),
          fileType: fileType.trim(),
          description: fileDescription.trim(),
        };
        title = fileName.trim();
        break;
    }

    const entryData = {
      entryType,
      title,
      content: null,
      entryDate: new Date(entryDate).toISOString(),
      metadata: newMetadata,
      selectedFile: selectedFile, // Pass selected file if exists
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
    setSelectedFile(null);
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
              <label>Select File</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleBrowseFile}
                  className="btn-browse-file"
                >
                  Browse...
                </button>
                {selectedFile && (
                  <span style={{ fontSize: '0.9rem', color: '#2c3e50' }}>
                    {selectedFile.name}
                  </span>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>File Name *</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="document.pdf"
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="What is this file about?"
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
