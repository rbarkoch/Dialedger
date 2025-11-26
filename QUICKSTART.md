# Dialedger - Quick Start Guide

## ✅ Project Setup Complete!

All tooling and dependencies have been installed and configured.

## Available Commands

### Development
```bash
npm run electron:dev
```
Starts the Vite dev server and opens the Electron app with hot reload enabled.

### Build for Production
```bash
npm run electron:build
```
Builds the React app and packages it as a desktop application for your platform.

### Just the Web UI (for testing)
```bash
npm run dev
```
Runs just the Vite dev server on http://localhost:5173 (without Electron).

## Project Structure

```
DialedgerProto/
├── main.js              # Electron main process (window management, IPC handlers)
├── preload.js           # Electron preload (IPC bridge to React)
├── database.js          # SQLite operations (CRUD for threads & entries)
├── index.html           # HTML entry point
├── vite.config.js       # Vite build configuration
├── package.json         # Dependencies and scripts
├── src/
│   ├── main.jsx         # React entry point
│   ├── App.jsx          # Main App component
│   ├── index.css        # Global styles
│   └── components/
│       ├── ThreadList.jsx    # Left sidebar with thread list
│       ├── ThreadView.jsx    # Main content area
│       ├── EntryForm.jsx     # Form to add new entries
│       └── EntryList.jsx     # Display entries in chronological order
```

## Technologies Used

- **Electron 28** - Desktop application framework
- **React 18** - UI library
- **Vite 5** - Fast build tool and dev server with SVG support (vite-plugin-svgr)
- **better-sqlite3 11** - SQLite database (local storage)
- **date-fns 3** - Date formatting
- **@dnd-kit** - Modern drag-and-drop library

## Features Implemented

✅ Create, edit, and manage multiple conversation threads  
✅ Drag-and-drop thread reordering with persistent order  
✅ Add 5 types of entries with type-specific fields:
  - **Note**: Simple content field
  - **Email**: From, To, Subject, Body
  - **Meeting**: Location, Attendees, Duration, Notes
  - **Conversation**: Participants, Location/Medium, Summary
  - **File**: File Name, Type, Description
✅ Edit entries after creation with pre-populated fields  
✅ Compact entry display with inline edit/delete buttons  
✅ View entries in chronological order with formatted metadata  
✅ Delete threads and entries with confirmation  
✅ Persistent local storage with SQLite  
✅ Modern Material Design SVG icons with color theming  
✅ Clean, minimalistic UI with light theme  
✅ Auto-generated titles based on entry type and content  

## Next Steps

1. Run `npm run electron:dev` to start the application
2. Create your first thread (click the + button in the sidebar)
3. Add entries of different types to see type-specific fields:
   - Try adding a note for quick thoughts
   - Add an email to track correspondence
   - Create a meeting entry with attendees
   - Log a conversation with participants
4. Edit threads or entries by clicking the edit button (✏️)
5. Reorder threads by dragging the `⋮⋮` handle that appears on hover
6. View how entries display with formatted metadata in a compact layout
7. When ready, use `npm run electron:build` to create a distributable package

## Database Location

The SQLite database will be created at:
- **macOS**: `~/Library/Application Support/dialedger/dialedger.db`
- **Windows**: `%APPDATA%/dialedger/dialedger.db`
- **Linux**: `~/.config/dialedger/dialedger.db`

## Need Help?

Check the main README.md or DESIGN.md for more details about the architecture and design decisions.
