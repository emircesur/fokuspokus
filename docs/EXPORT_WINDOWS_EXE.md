# Building fokuspokus Windows Executable (.exe)

This guide walks you through creating a Windows executable using **Electron**.

## Prerequisites

1. **Node.js** (v18+)
2. **Windows OS** (for building .exe) or cross-compilation tools

## Step 1: Download and Setup

1. Download the project from v0 (click three dots → "Download ZIP")
2. Extract and open in your terminal
3. Install dependencies:

```bash
npm install
```

## Step 2: Build the Next.js App as Static Export

Update `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

export default nextConfig
```

Build:

```bash
npm run build
```

## Step 3: Install Electron Dependencies

```bash
npm install --save-dev electron electron-builder
```

## Step 4: Create Electron Main Process

Create `electron/main.js`:

```javascript
const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a1a'
  })

  // Load the static export
  mainWindow.loadFile(path.join(__dirname, '../out/index.html'))

  // Remove menu bar for cleaner look (optional)
  Menu.setApplicationMenu(null)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
```

## Step 5: Create Electron Preload Script (Optional)

Create `electron/preload.js`:

```javascript
// Preload script for secure context bridge if needed
window.addEventListener('DOMContentLoaded', () => {
  console.log('fokuspokus loaded in Electron')
})
```

## Step 6: Update package.json

Add these fields to your `package.json`:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "electron .",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win",
    "electron:build:mac": "npm run build && electron-builder --mac",
    "electron:build:linux": "npm run build && electron-builder --linux"
  },
  "build": {
    "appId": "com.fokuspokus.app",
    "productName": "fokuspokus",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "out/**/*",
      "electron/**/*",
      "public/**/*"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ],
      "icon": "public/icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "installerIcon": "public/icon.ico",
      "uninstallerIcon": "public/icon.ico",
      "installerHeaderIcon": "public/icon.ico"
    },
    "mac": {
      "target": ["dmg", "zip"],
      "icon": "public/icon.icns",
      "category": "public.app-category.productivity"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "public/icon.png",
      "category": "Utility"
    }
  }
}
```

## Step 7: Create App Icons

For Windows, you need an `.ico` file. Create icons at these sizes:
- 16x16
- 32x32
- 48x48
- 64x64
- 128x128
- 256x256

You can use online tools like [ConvertICO](https://convertico.com/) to convert PNG to ICO.

Place `icon.ico` in the `public/` folder.

## Step 8: Build the Executable

### Windows Installer (.exe with setup wizard)
```bash
npm run electron:build:win
```

Output: `dist-electron/fokuspokus Setup x.x.x.exe`

### Portable Version (no installation required)
The build also creates: `dist-electron/fokuspokus x.x.x.exe`

## Step 9: Test Before Distribution

```bash
npm run electron:dev
```

## Alternative: Using Tauri (Smaller Size)

If you want a smaller executable (~10MB vs ~150MB), consider Tauri:

```bash
npm install --save-dev @tauri-apps/cli
npx tauri init
npx tauri build
```

Tauri requires Rust to be installed.

## Troubleshooting

### "electron is not recognized"
```bash
npx electron .
```

### Build fails on Windows
- Install Windows Build Tools:
```bash
npm install --global windows-build-tools
```

### App shows blank screen
- Ensure `out/` folder exists with `index.html`
- Check the path in `mainWindow.loadFile()`

### Icons not showing
- Ensure icon files are in the correct format (.ico for Windows)
- Verify paths in `build` configuration

## Code Signing (For Distribution)

For distributing your app without security warnings:

1. Get a code signing certificate from a CA (Comodo, DigiCert, etc.)
2. Add to electron-builder config:
```json
{
  "win": {
    "certificateFile": "path/to/certificate.pfx",
    "certificatePassword": "your-password"
  }
}
```
