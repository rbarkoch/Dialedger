# Dialedger

A desktop application for tracking conversation threads across multiple formats (notes, meetings, emails, conversations, and files).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run electron:dev
   ```

3. Build for production:
   ```bash
   npm run electron:build
   ```

## Features

- **Thread Management**: Create, edit, and organize multiple conversation threads with titles and descriptions
- **Drag-and-Drop Reordering**: Reorder threads via drag-and-drop with persistent order across app restarts
- **Multiple Entry Types**: Add notes, meetings, conversations, emails, and file attachments with type-specific fields
- **Edit Capabilities**: Edit both threads and entries after creation
- **Type-Specific Fields**: Each entry type has custom fields:
  - **Notes**: Simple text content
  - **Meetings**: Location, attendees, duration, notes
  - **Conversations**: Participants, medium (in-person, phone, etc.), summary
  - **Emails**: From, To, CC, BCC, subject, body, attachments list
  - **Files**: File name, type, description with actual file storage
- **Email Import**: Drag-and-drop .eml files to automatically parse and create email entries with full metadata (From, To, CC, BCC, subject, body, attachments)
- **File Attachments**: 
  - Drag-and-drop any file type to create file attachment entries
  - Browse and select files via dialog when creating entries manually
  - Download attachments with save-as dialog
  - Automatic file cleanup when entries are deleted
- **Markdown Support**: Full markdown rendering in notes, email body, meeting notes, conversation summary, and file descriptions
- **Unified Ledger View**: View all entries in chronological order with auto-scroll to bottom (newest entry visible), full timestamp precision for proper ordering
- **SVG Icons**: Modern Material Design icons throughout the UI with proper color theming
- **Local Storage**: All data stored locally using SQLite with automatic timestamps, order persistence, and file attachment management

## Tech Stack

- **Electron**: Desktop application framework with IPC for file operations
- **React**: UI library
- **Vite**: Build tool and dev server with SVG-as-React-component support (vite-plugin-svgr)
- **SQLite (better-sqlite3)**: Local database with threads, entries, and attachments tables
- **mailparser**: EML file parsing for email import
- **react-markdown**: Markdown rendering for text content
- **date-fns**: Date formatting
- **@dnd-kit**: Modern drag-and-drop library for thread reordering

## Project Structure

```
DialedgerProto/
├── main.js           # Electron main process
├── preload.js        # Electron preload script (IPC bridge)
├── database.js       # SQLite database operations
├── index.html        # HTML entry point
├── src/
│   ├── main.jsx      # React entry point
│   ├── App.jsx       # Main App component
│   ├── index.css     # Global styles
│   ├── App.css       # App layout styles
│   ├── assets/
│   │   └── icons/    # SVG icon files (Material Design)
│   └── components/   # React components
│       ├── ThreadList.jsx      # Thread sidebar with drag-and-drop
│       ├── ThreadList.css
│       ├── ThreadView.jsx      # Main content area
│       ├── ThreadView.css
│       ├── EntryForm.jsx       # Dynamic form for all entry types
│       ├── EntryForm.css
│       ├── EntryList.jsx       # Compact entry display
│       ├── EntryList.css
│       └── icons/
│           ├── Icon.jsx        # Icon component wrapper
│           └── README.md       # Icon system documentation
├── package.json
├── vite.config.js
├── DESIGN.md         # Comprehensive design document
├── QUICKSTART.md     # Quick start guide
└── README.md         # This file
```
