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
- **Multiple Entry Types**: Add notes, meetings, conversations, emails, and file attachments with type-specific fields
- **Edit Capabilities**: Edit both threads and entries after creation
- **Type-Specific Fields**: Each entry type has custom fields (e.g., emails have From/To/Subject/Body)
- **Unified Ledger View**: View all entries chronologically in a single scrollable list with formatted metadata
- **Local Storage**: All data stored locally using SQLite with automatic timestamps

## Tech Stack

- **Electron**: Desktop application framework
- **React**: UI library
- **Vite**: Build tool and dev server
- **SQLite (better-sqlite3)**: Local database
- **date-fns**: Date formatting

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
│   └── components/   # React components
│       ├── ThreadList.jsx      # Thread sidebar with create/edit/delete
│       ├── ThreadList.css
│       ├── ThreadView.jsx      # Main content area
│       ├── ThreadView.css
│       ├── EntryForm.jsx       # Dynamic form for all entry types
│       ├── EntryForm.css
│       ├── EntryList.jsx       # Entry display with type-specific rendering
│       └── EntryList.css
├── package.json
├── vite.config.js
├── DESIGN.md         # Comprehensive design document
├── QUICKSTART.md     # Quick start guide
└── README.md         # This file
```
