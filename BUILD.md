# Building Dialedger for Distribution

This guide explains how to build Dialedger for different platforms.

## Prerequisites

- Node.js 18+ installed
- All dependencies installed (`npm install`)

## Building for Your Current Platform

To build for the platform you're currently on:

```bash
npm run electron:build
```

This will create a distributable package in the `dist/` directory.

## Building for Windows (from macOS)

electron-builder can cross-compile for Windows from macOS, but there are some important notes:

### Option 1: Build Windows Installer (NSIS)

```bash
npm run electron:build -- --win --x64
```

This creates a Windows installer (`.exe`) that works on 64-bit Windows systems.

For ARM64 Windows (Surface devices, etc.):
```bash
npm run electron:build -- --win --arm64
```

### Option 2: Build Portable Executable

For a portable version that doesn't require installation:

```bash
npm run electron:build -- --win portable --x64
```

### Important Notes for Windows Builds from macOS

1. **Code Signing**: Windows executables built on macOS won't be code-signed unless you have a Windows code signing certificate configured
2. **Testing**: You cannot test Windows builds directly on macOS - you'll need a Windows machine or VM
3. **NSIS**: The installer will work, but Windows SmartScreen may show warnings for unsigned apps
4. **Wine**: electron-builder will try to use Wine on macOS to build Windows installers. If Wine isn't installed, it may skip some build steps

### Installing Wine (Optional but Recommended)

Wine helps electron-builder create better Windows installers from macOS:

```bash
brew install --cask wine-stable
```

## Building for All Platforms

To build for macOS, Windows, and Linux in one command:

```bash
npm run electron:build -- --mac --win --linux
```

Note: This requires Wine for Windows builds and Docker for Linux builds (if building from macOS).

## Output Locations

After building, you'll find the installers in the `dist/` directory:

- **macOS**: `Dialedger-0.1.0.dmg` or `Dialedger-0.1.0-arm64.dmg`
- **Windows**: 
  - `Dialedger Setup 0.1.0.exe` (installer)
  - `Dialedger 0.1.0.exe` (portable version)
- **Linux**: `Dialedger-0.1.0.AppImage`

## Distribution Checklist

Before distributing your application:

- [ ] Update version number in `package.json`
- [ ] Test the built application on target platforms
- [ ] Add application icon (see Icon Setup below)
- [ ] Consider code signing (especially for macOS and Windows)
- [ ] Create release notes
- [ ] Test database migrations with existing user data

## Icon Setup

To add custom icons:

1. Create a `build/` directory in your project root
2. Add these icon files:
   - `icon.icns` - for macOS (512x512 PNG converted to ICNS)
   - `icon.ico` - for Windows (256x256 PNG converted to ICO)
   - `icon.png` - for Linux (512x512 PNG)

You can use online converters or tools like:
- https://cloudconvert.com/png-to-icns
- https://cloudconvert.com/png-to-ico

## Code Signing (Optional)

### macOS
```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password
npm run electron:build -- --mac
```

### Windows
```bash
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_password
npm run electron:build -- --win
```

---

# Building as a Docker Web Application

Dialedger can also be deployed as a web application using Docker.

## Building with Docker

### Using Docker Compose (Recommended)

```bash
docker compose up --build
```

This will:
- Build the Docker image
- Start the container
- Mount a persistent volume for data
- Expose the app on http://localhost:3001

### Using Docker Directly

Build the image:
```bash
npm run docker:build
# or
docker build -t dialedger .
```

Run the container:
```bash
npm run docker:run
# or
docker run -p 3001:3001 -v dialedger-data:/app/data dialedger
```

## Docker Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Port the server listens on |
| `DATA_PATH` | `/app/data` | Path for database and attachments |
| `NODE_ENV` | `production` | Node environment |

### Volumes

The Docker container uses a volume mounted at `/app/data` for persistent storage:
- `dialedger.db` - SQLite database
- `attachments/` - Uploaded file attachments

### Customizing docker-compose.yml

```yaml
services:
  dialedger:
    build: .
    ports:
      - "8080:3001"  # Change host port to 8080
    volumes:
      - ./my-data:/app/data  # Use local directory instead of volume
    environment:
      - PORT=3001
```

## Web vs Electron Differences

| Feature | Electron | Docker/Web |
|---------|----------|------------|
| File dialogs | Native OS dialogs | Browser file picker |
| File downloads | Save-as dialog | Browser download |
| Drag-drop files | Full path access | File object only |
| Package files (.scriv, .app) | Works | Must compress to .zip first |
| Offline access | Yes | Requires server |
| Multi-user | No | Yes (shared database) |

## Switching Between Modes

When switching between Electron and Node.js/Docker modes, you need to rebuild native modules:

### For Electron development:
```bash
npm run postinstall  # Runs electron-rebuild
```

### For Node.js/Docker:
```bash
npm rebuild better-sqlite3
```

---

## Troubleshooting

### "Cannot find module 'better-sqlite3'"

Run `npm run postinstall` to rebuild native modules for Electron.

### Windows build fails on macOS

Install Wine: `brew install --cask wine-stable`

### App won't start after building

Check that all files are included in the `build.files` array in `package.json`.

### Docker: "ERR_DLOPEN_FAILED" for better-sqlite3

The native module wasn't built correctly. Rebuild the Docker image:
```bash
docker compose build --no-cache
```

### Web: File upload fails with ERR_ACCESS_DENIED

This usually means you're trying to upload a macOS package/bundle (like `.scriv` or `.app`), which is actually a folder. Compress it to a `.zip` file first.

## Native Module Considerations

This app uses `better-sqlite3`, a native Node.js module. electron-builder automatically rebuilds it for the target platform, but be aware:

- Windows builds from macOS may require additional setup
- Always test on the target platform before distributing
- The `postinstall` script handles rebuilding for development
- Docker builds handle native compilation automatically

## Further Reading

- [electron-builder documentation](https://www.electron.build/)
- [Code Signing Guide](https://www.electron.build/code-signing)
- [Multi-Platform Build](https://www.electron.build/multi-platform-build)
- [Docker Documentation](https://docs.docker.com/)
