# Mobile apps (Capacitor — iOS & Android)

One Capacitor shell wraps the existing React app (students + teacher/assistant dashboard).

## Prerequisites

- Node.js 20+
- [Android Studio](https://developer.android.com/studio) (Android SDK + emulator or device)
- [Xcode](https://developer.apple.com/xcode/) on macOS (iOS Simulator or device)
- A **live HTTPS API** URL (Capacitor has no Vite `/api` proxy)

## 1. Point the app at your API

Copy env example and set the API origin (no trailing slash):

```bash
cd src/LearnMS.React
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=https://your-api.example.com
```

Web/dev can leave `VITE_API_URL` empty and keep using the Vite proxy (`VITE_API_PROXY`).

## 2. Build & sync native projects

```bash
cd src/LearnMS.React
npm run build:mobile
```

This runs `vite build` then `npx cap sync` into `android/` and `ios/`.

## 3. Run on Android

```bash
npm run cap:android
```

In Android Studio: pick a device/emulator → Run.

Or from CLI (with SDK configured):

```bash
npx cap run android
```

## 4. Run on iOS (macOS)

```bash
npm run cap:ios
```

In Xcode: select a simulator or signed device → Run.

First device run needs an Apple Team under Signing & Capabilities.

Or:

```bash
npx cap run ios
```

## 5. Verify on a physical device

1. Sign in as **Student** — home, courses, lessons, quizzes load from your API.
2. Sign in as **Teacher / Assistant** — open Dashboard.
3. Open a **barcode scanner** page (lecture attendance or rewards) — allow camera — scan a code.

Simulators often have no real camera; use a phone for scanners.

## Useful scripts

| Script | Purpose |
|--------|---------|
| `npm run build:mobile` | Production web build + `cap sync` |
| `npm run cap:sync` | Sync already-built `dist/` to native |
| `npm run cap:android` | Open Android Studio |
| `npm run cap:ios` | Open Xcode |

## App identity

Configured in `capacitor.config.ts`:

- **App ID:** `com.learnms.app`
- **Name:** Rafik Learn

Change these before store submission if you need a different bundle id.

## Camera permissions

Already set for Quagga scanners:

- Android: `CAMERA` in `android/app/src/main/AndroidManifest.xml`
- iOS: `NSCameraUsageDescription` in `ios/App/App/Info.plist`

## Notes

- Auth uses Bearer tokens in `localStorage` — works in the Capacitor WebView.
- After any frontend change: `npm run build:mobile` (or `build` + `cap:sync`) before testing native.
- Store listing, icons, splash art, and developer accounts are outside this setup.
