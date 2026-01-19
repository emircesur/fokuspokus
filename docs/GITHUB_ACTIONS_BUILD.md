# GitHub Actions - Automatic Desktop Builds

This project includes a GitHub Actions workflow that automatically builds your app for Windows, Mac, and Linux whenever you push code.

## How It Works

1. **Push to `main` branch** - Builds run automatically
2. **Create a Pull Request** - Builds run for testing
3. **Push a version tag** (e.g., `v1.0.0`) - Builds run AND creates a GitHub Release with downloadable files
4. **Manual trigger** - Run builds anytime from GitHub UI

## Setup Instructions

### Step 1: Push to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add your GitHub repo as remote
git remote add origin https://github.com/YOUR_USERNAME/fokuspokus.git

# Push to main branch
git push -u origin main
```

### Step 2: Enable Actions

1. Go to your GitHub repository
2. Click **Actions** tab
3. If prompted, enable GitHub Actions

### Step 3: Check Build Status

After pushing:
1. Go to **Actions** tab
2. Click on the running workflow
3. Watch the build progress for each platform

### Step 4: Download Your Builds

Once complete:
1. Click on the completed workflow run
2. Scroll to **Artifacts** section
3. Download:
   - `windows-build` - Contains `.exe` installer
   - `mac-build` - Contains `.dmg` installer  
   - `linux-build` - Contains `.AppImage` and `.deb`

## Creating a Release

To create a proper release with downloadable files:

```bash
# Tag your release
git tag v1.0.0

# Push the tag
git push origin v1.0.0
```

This will:
1. Trigger builds for all platforms
2. Create a GitHub Release automatically
3. Attach all built files to the release
4. Users can download directly from your Releases page

## Manual Build Trigger

1. Go to **Actions** tab
2. Click **Build Desktop Apps** workflow
3. Click **Run workflow** dropdown
4. Click green **Run workflow** button

## Workflow Features

| Feature | Description |
|---------|-------------|
| Windows | Builds `.exe` installer (NSIS) and portable `.zip` |
| Mac | Builds `.dmg` installer and `.zip` |
| Linux | Builds `.AppImage` and `.deb` package |
| Caching | npm dependencies are cached for faster builds |
| Artifacts | Builds are stored for 30 days |
| Auto-release | Version tags trigger automatic releases |

## Customizing the Workflow

Edit `.github/workflows/build-desktop.yml` to:

- Change which branches trigger builds
- Modify artifact retention days
- Add code signing (for production apps)
- Add notarization for Mac (required for distribution)

## Troubleshooting

### Build fails with "electron-builder" error

Make sure your `package.json` has the correct dependencies:
```json
{
  "devDependencies": {
    "electron-builder": "^25.0.0"
  }
}
```

### Artifacts not appearing

- Check the build logs for errors
- Ensure the `out/` folder is created by Next.js build
- Verify `dist-electron/` is the correct output path

### Release not created

- Make sure you pushed a tag starting with `v` (e.g., `v1.0.0`)
- Check that all three builds completed successfully

## Cost

GitHub Actions is **free** for public repositories with generous limits. For private repos:
- 2,000 minutes/month free
- Windows builds use 2x minutes (1 min = 2 min counted)
- Mac builds use 10x minutes (1 min = 10 min counted)

A typical build takes ~5-10 minutes per platform.
