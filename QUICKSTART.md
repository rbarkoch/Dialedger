# Dialedger - Quick Start Guide

## ✅ Project Setup Complete!

All tooling and dependencies have been installed and configured.

## Available Commands

### Electron Desktop App

#### Development
```bash
npm run electron:dev
```
Starts the Vite dev server and opens the Electron app with hot reload enabled.

#### Build for Production
```bash
npm run electron:build
```
Builds the React app and packages it as a desktop application for your platform.

### Docker Web App

#### Run with Docker Compose (Recommended)
```bash
docker compose up --build
```
Builds the Docker image and starts the container. Access the app at http://localhost:3001

Data is persisted in a Docker volume (`dialedger-data`).

#### Run Docker Manually
```bash
npm run docker:build
npm run docker:run
```

### Local Web Server (without Docker)

#### Development
```bash
npm run server:dev
```
Builds the React app and starts the Express server on http://localhost:3001

**Note:** If you've previously run Electron, rebuild native modules first:
```bash
npm rebuild better-sqlite3
```

#### Just the Web UI (for testing React)
```bash
npm run dev
```
Runs just the Vite dev server on http://localhost:5173 (without backend).

## Project Structure

```
DialedgerProto/
├── main.js              # Electron main process (window management, IPC handlers)
├── preload.js           # Electron preload (IPC bridge to React)
├── database.js          # SQLite operations for Electron
├── Dockerfile           # Docker build configuration
├── docker-compose.yml   # Docker Compose for easy deployment
├── index.html           # HTML entry point
├── vite.config.js       # Vite build configuration
├── package.json         # Dependencies and scripts
├── server/
│   ├── index.js         # Express web server with REST API
│   └── database.js      # SQLite operations for web server
├── src/
│   ├── main.jsx         # React entry point
│   ├── App.jsx          # Main App component
│   ├── api.js           # API abstraction (Electron IPC / REST API)
│   ├── index.css        # Global styles
│   └── components/
│       ├── ThreadList.jsx    # Left sidebar with thread list
│       ├── ThreadView.jsx    # Main content area
│       ├── EntryForm.jsx     # Form to add new entries
│       └── EntryList.jsx     # Display entries in chronological order
```

## Technologies Used

- **Electron 28** - Desktop application framework
- **Express 4** - Web server for Docker/browser deployment
- **React 18** - UI library
- **Vite 5** - Fast build tool and dev server with SVG support (vite-plugin-svgr)
- **better-sqlite3 11** - SQLite database (local storage with threads, entries, and attachments tables)
- **mailparser** - EML file parsing for email import
- **react-markdown** - Markdown rendering for text content
- **date-fns 3** - Date formatting
- **@dnd-kit** - Modern drag-and-drop library
- **Docker** - Containerized deployment

## Features Implemented

✅ Create, edit, and manage multiple conversation threads  
✅ Drag-and-drop thread reordering with persistent order  
✅ Add 5 types of entries with type-specific fields:
  - **Note**: Simple content field
  - **Email**: From, To, CC, BCC, Subject, Body, Attachments list
  - **Meeting**: Location, Attendees, Duration, Notes
  - **Conversation**: Participants, Location/Medium, Summary
  - **File**: File Name, Type, Description with actual file storage
✅ **Email Import**: Drag-and-drop .eml files to automatically parse and create email entries with full metadata  
✅ **File Attachments**: 
  - Drag-and-drop any file to create file attachment entries
  - Browse and select files via dialog in the form
  - Download attachments with save-as dialog (Electron) or direct download (web)
  - Automatic file cleanup when entries are deleted
✅ **Markdown Support**: Full markdown rendering in notes, email body, meeting notes, conversation summary, and file descriptions  
✅ Edit entries after creation with pre-populated fields  
✅ Compact entry display with inline edit/delete buttons  
✅ View entries in chronological order with auto-scroll to bottom (newest entry visible), full timestamp precision  
✅ Delete threads and entries with confirmation  
✅ Persistent local storage with SQLite (threads, entries, attachments)  
✅ Modern Material Design SVG icons with color theming  
✅ Clean, minimalistic UI with light theme  
✅ Auto-generated titles based on entry type and content  
✅ Current date/time defaults for manually created entries  
✅ **Docker deployment** for running as a web application  
✅ **API abstraction layer** that works with both Electron and web  

## Deployment Options

### Desktop (Electron)
- Full native file system access
- Native dialogs for file selection and saving
- Runs offline without a server

### Web (Docker)
- Access from any device on your network
- Data persisted in Docker volumes
- 100MB file upload limit
- Note: macOS package files (like .scriv) cannot be uploaded directly (compress to .zip first)

## Next Steps

### For Desktop Development
1. Run `npm run electron:dev` to start the application
2. Create your first thread (click the + button in the sidebar)
3. Add entries of different types
4. When ready, use `npm run electron:build` to create a distributable package

### For Web/Docker Deployment
1. Run `docker compose up --build` to start the container
2. Open http://localhost:3001 in your browser
3. Create threads and add entries
4. Data persists across container restarts via Docker volumes

## Database & File Storage Locations

The SQLite database and file attachments will be stored at:
- **macOS**: 
  - Database: `~/Library/Application Support/dialedger/dialedger.db`
  - Attachments: `~/Library/Application Support/dialedger/attachments/`
- **Windows**: 
  - Database: `%APPDATA%/dialedger/dialedger.db`
  - Attachments: `%APPDATA%/dialedger/attachments/`
- **Linux**: 
  - Database: `~/.config/dialedger/dialedger.db`
  - Attachments: `~/.config/dialedger/attachments/`

## Need Help?

Check the main README.md or DESIGN.md for more details about the architecture and design decisions.
