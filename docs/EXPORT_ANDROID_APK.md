# Building fokuspokus Android APK

This guide walks you through creating an APK file for Android using **Capacitor**.

## Prerequisites

1. **Node.js** (v18+)
2. **Android Studio** (with SDK 33+)
3. **Java JDK 17**

## Step 1: Download and Setup

1. Download the project from v0 (click three dots → "Download ZIP")
2. Extract and open in your terminal
3. Install dependencies:

```bash
npm install
```

## Step 2: Build the Next.js App as Static Export

Add static export configuration to `next.config.mjs`:

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

Build the static export:

```bash
npm run build
```

This creates an `out/` folder with static files.

## Step 3: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init fokuspokus com.fokuspokus.app --web-dir=out
```

## Step 4: Configure Capacitor

Create/update `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.fokuspokus.app',
  appName: 'fokuspokus',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
      signingType: 'apksigner'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1a1a1a",
      showSpinner: false
    }
  }
}

export default config
```

## Step 5: Add Android Platform

```bash
npx cap add android
```

## Step 6: Update Android Files

### Update app icon
Place your icons in:
- `android/app/src/main/res/mipmap-mdpi/` (48x48)
- `android/app/src/main/res/mipmap-hdpi/` (72x72)
- `android/app/src/main/res/mipmap-xhdpi/` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/` (192x192)

### Update colors (android/app/src/main/res/values/colors.xml)
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#E54D2E</color>
    <color name="colorPrimaryDark">#1a1a1a</color>
    <color name="colorAccent">#E54D2E</color>
</resources>
```

## Step 7: Build the APK

### Option A: Using Android Studio (Recommended)

```bash
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Find APK at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option B: Using Command Line

```bash
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

## Step 8: Create Signed Release APK (For Distribution)

1. Generate a keystore:
```bash
keytool -genkey -v -keystore fokuspokus-release.keystore -alias fokuspokus -keyalg RSA -keysize 2048 -validity 10000
```

2. Build release APK:
```bash
cd android
./gradlew assembleRelease
```

3. Or in Android Studio: **Build → Generate Signed Bundle / APK**

## Updating After Changes

When you make changes to the web app:

```bash
npm run build
npx cap sync android
npx cap open android
```

Then rebuild the APK in Android Studio.

## Troubleshooting

### "SDK location not found"
Create `android/local.properties`:
```
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```
(Adjust path for your OS)

### Build fails with Java errors
Ensure JAVA_HOME points to JDK 17:
```bash
export JAVA_HOME=/path/to/jdk-17
```

### App shows blank screen
- Check that `out/` folder exists and contains `index.html`
- Verify `webDir` in `capacitor.config.ts` is set to `out`
