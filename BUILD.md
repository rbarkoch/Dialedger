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

## Troubleshooting

### "Cannot find module 'better-sqlite3'"

Run `npm run postinstall` to rebuild native modules for Electron.

### Windows build fails on macOS

Install Wine: `brew install --cask wine-stable`

### App won't start after building

Check that all files are included in the `build.files` array in `package.json`.

## Native Module Considerations

This app uses `better-sqlite3`, a native Node.js module. electron-builder automatically rebuilds it for the target platform, but be aware:

- Windows builds from macOS may require additional setup
- Always test on the target platform before distributing
- The `postinstall` script handles rebuilding for development

## Further Reading

- [electron-builder documentation](https://www.electron.build/)
- [Code Signing Guide](https://www.electron.build/code-signing)
- [Multi-Platform Build](https://www.electron.build/multi-platform-build)
