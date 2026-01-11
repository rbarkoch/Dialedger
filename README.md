<p align="center">
  <h1 align="center">📒 Dialedger</h1>
  <p align="center">
    <strong>Keep every conversation in one place.</strong>
  </p>
  <p align="center">
    A conversation tracking tool that unifies emails, meetings, notes, and files into organized threads.
  </p>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-documentation">Documentation</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a> •
  <a href="#-ai-disclaimer">AI Generated Software Disclaimer</a>
</p>

---

## 🎯 The Problem

Tracking conversations across different channels is hard. One topic might span multiple emails, a phone call, a meeting, and several notes. Important context gets scattered and lost.

**Dialedger** brings it all together. Create a thread for any topic, then add entries as the conversation evolves—whether it's an email, a meeting summary, a quick note, or a file attachment. Everything stays in chronological order, so you always have the complete picture.

## ✨ Features

- **🧵 Unified Threads** — Organize conversations by topic, project, or person
- **📝 Multiple Entry Types** — Notes, meetings, conversations, emails, and file attachments
- **📧 Email Import** — Drag-and-drop `.eml` files to auto-parse sender, recipients, subject, and body
- **📎 File Attachments** — Attach any file type with drag-and-drop or file browser
- **✏️ Markdown Support** — Rich text formatting in notes, email bodies, and meeting summaries
- **🔀 Drag-and-Drop Ordering** — Reorder threads with intuitive drag-and-drop
- **📅 Chronological View** — See all entries in order with full timestamp precision
- **💾 Local Storage** — Your data stays on your machine (or server), powered by SQLite

## 🖥️ Screenshots

*Coming soon*

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

### Quick Start (Docker)

The fastest way to try Dialedger:

```bash
docker compose up --build
```

Open http://localhost:3001 in your browser. That's it!

### Quick Start (Desktop)

For the full desktop experience with native file dialogs:

```bash
# Install dependencies
npm install

# Run the app
npm run electron:dev
```

## 📦 Deployment

Dialedger supports multiple deployment options:

| Mode | Best For | Command |
|------|----------|---------|
| **Docker** | Self-hosted server, team access | `docker compose up --build` |
| **Desktop (Electron)** | Personal use, offline access | `npm run electron:dev` |
| **Node.js Server** | Development, custom hosting | `npm run server:dev` |

### Docker Deployment

```bash
# Build and start
docker compose up --build

# Run in background
docker compose up -d

# Stop
docker compose down
```

Data persists in a Docker volume, so your threads survive container restarts.

### Desktop Build

Create distributable installers for macOS, Windows, or Linux:

```bash
npm run electron:build        # Current platform
npm run electron:build:all    # All platforms
```

See [BUILD.md](BUILD.md) for detailed build instructions.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | Get up and running in minutes |
| [BUILD.md](BUILD.md) | Build instructions for all platforms |
| [DESIGN.md](DESIGN.md) | Architecture and design decisions |

## 🛠️ Tech Stack

- **Frontend**: React, Vite, @dnd-kit
- **Backend**: Electron (desktop) / Express (web)
- **Database**: SQLite via better-sqlite3
- **Styling**: CSS with Material Design icons
- **Containerization**: Docker

## 📄 License

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE.txt](LICENSE.txt) file for details.

This means you're free to use, modify, and distribute this software, but any derivative works must also be open source under the same license.

---

## ⚠️ AI-Generated Software Disclaimer

**This software was written entirely by AI.** The code, documentation, and architecture were generated through conversations with AI language models.

This project was generated to create a simple and functional tool based on an idea of the developer. Please be aware:

- **No human code review** has been performed on the generated code
- **Bugs and security vulnerabilities** may exist that would typically be caught by human developers
- **Use at your own risk** — especially for sensitive or production data
- **Test thoroughly** before relying on this software for important information

We encourage users to review the code themselves before using. This transparency notice is provided so you can make informed decisions about using this software.

Maybe one day, this software will be re-written by a human, but for now this software is sufficient.