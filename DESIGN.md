# Project Design Document

## 1. Project Overview

### Project Name
Dialedger

### Purpose
Dialedger is a tool used to track the thread of conversation for any given topic.

### Target Users
People who are trying to track the thread of conversation for a given topic over
multiple formats such as e-mail, notes, meetings, etc.

### Problem Statement
Tracking a thread of conversation can be difficult. Sometimes the conversation
is occurring through e-mail. Sometimes it is in-person. Other times it is through
meetings. Dialedger helps keep all these different interactions together under
one thread of conversation.

---

## 2. Core Features

### Must-Have Features (MVP)
1. **Multiple Thread of Conversation** - User can create a thread of conversation at any point and begin adding information into it.
2. **Multiple Item Types** - Entries can be added to a thread in multiple types: Note, Meeting, Conversation, E-Mail, or File Attachment.
3. **Unified Ledger View** - Each thread of conversation can be viewed in a single scrollable list displaying each entry one-by-one.

### Nice-to-Have Features (Completed)
1. **Drag-and-Drop for .eml Files** - User can drag-and-drop *.eml files to automatically parse and add e-mail entries with full metadata.
2. **Drag-and-Drop for Any File** - User can drag-and-drop any file type to create file attachment entries with storage and download capabilities.
3. **Thread Reordering** - User can reorder threads via drag-and-drop with persistent order across app restarts.

### Future Enhancements
1. **Search and Filter** - Search across threads and entries
2. **Export Thread** - Export thread as PDF or markdown
3. **Tagging System** - Add tags to threads for better organization

---

## 3. User Experience

### User Flow

1. User starts by: **Creating a thread of conversation with a title and optional description.**
2. Then: **The user selects a thread and adds entries as interactions occur, choosing the appropriate type (Note, Email, Meeting, Conversation, or File).**
3. Each entry type shows **relevant fields only** (e.g., emails show From/To/Subject/Body).
4. User can **edit threads or entries** at any time by clicking the edit button.
5. Finally: **The user reviews the complete conversation thread with all entries displayed chronologically with formatted metadata.**

---

## 4. Technical Architecture

### Technology Stack

#### Frontend
- **Framework/Library**: React
- **Styling**: CSS with basic styling (potentially Tailwind CSS for rapid prototyping)
- **State Management**: React Context API (sufficient for prototype)

#### Backend
- **Language/Runtime**: Node.js (built into Electron)
- **Framework**: Electron main process
- **API Type**: IPC (Inter-Process Communication) between Electron main and renderer processes

#### Database
- **Type**: SQLite (local file-based database, perfect for desktop apps)
- **ORM/ODM**: better-sqlite3 (simple and synchronous, easy to work with)

#### Infrastructure
- **Hosting**: Local desktop application (cross-platform: Windows, macOS, Linux)
- **Authentication**: None (single-user desktop application)

### System Architecture
**Electron desktop application with main process handling database operations and renderer process for UI. All data stored locally in SQLite database file.**

```
┌─────────────────────────────────────┐
│     Electron Application            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Renderer Process (React)    │ │
│  │   - UI Components             │ │
│  │   - Thread List               │ │
│  │   - Entry Forms               │ │
│  └──────────┬────────────────────┘ │
│             │ IPC                   │
│             ▼                       │
│  ┌───────────────────────────────┐ │
│  │   Main Process (Node.js)      │ │
│  │   - Database Operations       │ │
│  │   - File System Access        │ │
│  └──────────┬────────────────────┘ │
│             │                       │
│             ▼                       │
│  ┌───────────────────────────────┐ │
│  │   SQLite Database             │ │
│  │   - threads.db                │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 5. Data Model

### Primary Entities

#### Entity 1: Thread
```
{
  id: INTEGER PRIMARY KEY AUTOINCREMENT
  title: TEXT NOT NULL              // Name of the conversation thread
  description: TEXT                 // Optional description
  display_order: INTEGER DEFAULT 0  // Order for display (drag-and-drop)
  created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
  updated_at: DATETIME DEFAULT CURRENT_TIMESTAMP
}
```

#### Entity 2: Entry
```
{
  id: INTEGER PRIMARY KEY AUTOINCREMENT
  thread_id: INTEGER NOT NULL       // Foreign key to Thread
  entry_type: TEXT NOT NULL         // 'note', 'meeting', 'conversation', 'email', 'file'
  title: TEXT                       // Entry title/subject (not used for some types)
  content: TEXT                     // Main content/body (not used for some types)
  entry_date: DATETIME NOT NULL     // When the interaction occurred (stored with full timestamp precision including seconds/milliseconds)
  created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
  metadata: TEXT                    // JSON string for type-specific data
}

Type-Specific Metadata Structures:

Note:
{
  content: TEXT                     // Note content
}

Email:
{
  from: TEXT                        // Sender email address
  to: TEXT                          // Recipient email address(es)
  cc: TEXT                          // CC recipients
  bcc: TEXT                         // BCC recipients
  subject: TEXT                     // Email subject
  body: TEXT                        // Email body content
  attachments: TEXT/ARRAY           // Attachment filenames (from parsed .eml)
}

Meeting:
{
  location: TEXT                    // Meeting location (physical or virtual)
  attendees: TEXT                   // Comma-separated list of attendees
  duration: TEXT                    // Duration (e.g., "1 hour", "30 minutes")
  notes: TEXT                       // Meeting notes/summary
}

Conversation:
{
  participants: TEXT                // Who was involved in the conversation
  location: TEXT                    // Where it occurred (in-person, phone, etc.)
  summary: TEXT                     // Summary of the conversation
}

File:
{
  fileName: TEXT                    // Name of the file
  fileType: TEXT                    // File type/extension
  description: TEXT                 // Description of the file
  filePath: TEXT                    // Path to stored file (future)
}
```

#### Entity 3: Attachment
```
{
  id: INTEGER PRIMARY KEY AUTOINCREMENT
  entry_id: INTEGER NOT NULL        // Foreign key to Entry
  file_name: TEXT NOT NULL          // Original file name
  file_path: TEXT NOT NULL          // Path to stored file
  file_size: INTEGER                // Size in bytes
  mime_type: TEXT                   // File MIME type
  created_at: DATETIME DEFAULT CURRENT_TIMESTAMP
}
```

### Relationships
- **Thread** → **Entry**: one-to-many (one thread contains many entries)
- **Entry** → **Attachment**: one-to-many (one entry can have multiple attachments)

---

## 6. IPC Channels (Electron Communication)

### Core IPC Channels

| Channel | Direction | Purpose | Data | Response |
|---------|-----------|---------|------|----------|
| **threads:getAll** | Renderer → Main | Get all threads | None | Array of Thread objects (ordered by display_order) |
| **threads:create** | Renderer → Main | Create new thread | { title, description } | Thread object |
| **threads:update** | Renderer → Main | Update thread | { id, title, description } | Thread object |
| **threads:updateOrder** | Renderer → Main | Update thread order | { threadOrders: [{id, order}] } | Success boolean |
| **threads:delete** | Renderer → Main | Delete thread | { id } | Success boolean |
| **entries:getByThread** | Renderer → Main | Get entries for thread | { threadId } | Array of Entry objects (ordered ASC by entry_date) |
| **entries:create** | Renderer → Main | Create new entry | { threadId, entryType, title, content, entryDate, metadata } | Entry object |
| **entries:update** | Renderer → Main | Update entry | { id, title, content, entryDate } | Entry object |
| **entries:delete** | Renderer → Main | Delete entry | { id } | Success boolean (also deletes physical files) |
| **eml:parse** | Renderer → Main | Parse .eml file | { filePath } | Parsed email data (from, to, cc, bcc, subject, body, attachments) |
| **file:select** | Renderer → Main | Show file picker dialog | None | File object { path, name, size, type } |
| **attachments:save** | Renderer → Main | Save file attachment | { entryId, filePath, fileName } | Attachment object |
| **attachments:getByEntry** | Renderer → Main | Get attachments for entry | { entryId } | Array of Attachment objects |
| **attachments:download** | Renderer → Main | Download/save attachment | { attachmentId, fileName } | Show save dialog and copy file |
| **attachments:delete** | Renderer → Main | Delete attachment | { attachmentId } | Success boolean (also deletes physical file) |

---

## 7. UI/UX Design

### Key Screens/Views
1. **Main Page**
   - Purpose: This purpose is the primary page of the application.
   - Components: A navigation bar on the left-hand side to choose the thread of conversation and a main content area where the selected thread is displayed.
   - Actions: In the navigation area, the user can select the thread and add new threads. In the main content area, the user can view the thread and add new entries to the thread.

### Design Considerations
- **Color Scheme**: Neural colors. Light theme.
- **Layout**: Navigation bar on left hand side. Primary content in the center.

---

## 8. Security & Privacy

### Authentication & Authorization
**Not applicable for prototype - single-user desktop application with local data storage.**

### Data Protection
**All data stored locally in SQLite database file in user's application data directory. No encryption for prototype phase.**

### Security Considerations
- **Local Data Only**: All data remains on user's machine, no network transmission
- **Basic Input Validation**: Validate user inputs to prevent SQLite injection

---

## 9. Performance & Scalability

### Expected Load
- **Initial Users**: Single user per installation
- **Concurrent Users**: 1 (desktop application)
- **Data Volume**: Estimated 100-1000 threads, 10-100 entries per thread

### Optimization Strategies
**SQLite provides excellent performance for local data. For prototype, no specific optimizations needed. Future considerations:**
- Lazy loading of thread entries (load on demand)
- Pagination for large thread lists
- Database indexes on thread_id and entry_date fields

---

## 10. Development Plan

### Phase 1: Setup & Foundation
- [x] **Initialize Electron + React project** - 1-2 hours
- [x] **Set up SQLite database with better-sqlite3** - 1-2 hours
- [x] **Create database schema and migration** - 1 hour
- [x] **Set up basic IPC communication** - 1 hour
- [x] **Create basic app layout (navigation + content area)** - 2-3 hours

### Phase 2: Core Features
- [x] **Implement thread list component** - 2-3 hours
- [x] **Implement create/edit/delete thread functionality** - 2-3 hours
- [x] **Implement entry display component** - 2-3 hours
- [x] **Implement create entry form with type selection** - 3-4 hours
- [x] **Implement edit/delete entry functionality** - 2 hours
- [x] **Add type-specific metadata fields for each entry type** - 2-3 hours
- [x] **Add drag-and-drop thread reordering with persistence** - 2-3 hours
- [x] **Replace emoji icons with SVG icons** - 2 hours
- [x] **Modernize UI with minimalistic design** - 2 hours
- [x] **Add file attachment support with drag-and-drop and browse dialog** - 3-4 hours
- [x] **Add .eml file parsing for email import** - 2 hours
- [x] **Add markdown rendering for text content** - 1 hour
- [x] **Implement ascending entry order with auto-scroll to bottom** - 1 hour

### Phase 3: Polish & Testing
- [x] **Add basic styling and layout improvements** - 2-3 hours
- [ ] **Manual testing of all features** - 2 hours
- [ ] **Bug fixes and refinements** - 2-4 hours
- [ ] **Package application for distribution** - 1-2 hours

### Total Estimated Time
**30-40 hours (1 week of focused development)**

---

## 11. Testing Strategy

### Unit Tests
**Not included in prototype phase. Manual testing only.**

### Integration Tests
**Not included in prototype phase. Manual testing only.**

### User Acceptance Testing
**Manual testing of core workflows:**
- Create, view, edit, and delete threads
- Add different types of entries to threads
- View entries in chronological order
- Attach and open files

---

## 12. Dependencies & Third-Party Services

### External APIs
- **None**: Fully offline desktop application

### Third-Party Libraries
- **Electron**: Desktop application framework
- **React**: UI library
- **better-sqlite3**: SQLite database driver
- **date-fns**: Date formatting and manipulation
- **Tailwind CSS** (optional): Utility-first CSS framework for rapid styling

---

## 13. Deployment & DevOps

### Deployment Strategy
**Manual packaging using electron-builder for macOS, Windows, and Linux. Distribute as downloadable installers.**

### Environment Configuration
- **Development**: `npm run dev` - Electron with hot reload
- **Staging**: Not applicable for prototype
- **Production**: `npm run build` - Creates packaged executables

### Monitoring & Logging
**Console logging only for prototype. No external monitoring or analytics.**

---

## 14. Known Constraints & Limitations

### Technical Constraints
- **Local Storage Only**: No cloud sync or backup functionality
- **Single User**: No multi-user or collaboration features
- **Basic UI**: Minimal styling and polish for prototype phase
- **No Email Parsing**: .eml files must be manually processed (drag-and-drop is future feature)

### Business Constraints
- **Prototype Phase**: Focus on core functionality, defer advanced features
- **Time Limited**: 1 week development window
- **No Testing Infrastructure**: Manual testing only

---

## 15. Success Metrics

### Key Performance Indicators (KPIs)
- **Functional Completeness**: All 3 MVP features working
- **Usability**: Can create and view threads with entries in under 2 minutes
- **Stability**: No crashes during typical usage scenarios

### Definition of Success
**A successful prototype demonstrates:**
- ✅ User can create, edit, and delete multiple threads
- ✅ User can reorder threads via drag-and-drop with persistent order
- ✅ User can add all 5 entry types with type-specific fields (Note, Meeting, Conversation, E-Mail, File)
- ✅ User can edit entries after creation
- ✅ Entries display in chronological order with auto-scroll to newest entry and full timestamp precision
- ✅ Markdown rendering support for notes and text fields
- ✅ Modern UI with SVG icons and minimalistic design
- ✅ Data persists between application restarts
- ✅ Application runs on macOS (tested and working)

---

## 16. Open Questions & Decisions Needed

1. **Entry Form Design**: Should all entry types use the same form with conditional fields, or separate forms for each type?
   - Decision: Single form with dynamic fields based on type selection - each type shows only relevant fields

2. **File Storage**: Where should attached files be stored?
   - Recommendation: Create `attachments/` folder in app data directory, organize by thread ID

3. **Date/Time Input**: How should users input entry dates?
   - Recommendation: Date picker with time input, default to current date/time

4. **Thread Sorting**: How should threads be sorted in the navigation?
   - ✅ Decision: User-defined order via drag-and-drop, persisted in display_order column
