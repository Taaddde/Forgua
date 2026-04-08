# Building Forgua Desktop

Forgua ships as both a PWA and a native desktop app via [Tauri 2.0](https://v2.tauri.app/).

## Prerequisites

- **Node.js 18+**
- **Rust 1.77.2+** — install from https://rustup.rs
- Platform-specific dependencies (see below)

### macOS

```bash
xcode-select --install
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
  libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

### Windows

- Install **Visual Studio 2022 Build Tools** with "Desktop development with C++"
- WebView2 is included in Windows 10/11

## Verify environment

```bash
rustc --version       # Rust 1.77.2+
cargo --version
npx tauri info        # Prints dependency status
```

## Development

```bash
npm install
npm run tauri:dev
```

This compiles the frontend (Vite) + backend (Rust) and opens a native window with hot-reload.

## Production build

```bash
npm run tauri:build
```

Output binaries are in `src-tauri/target/release/bundle/`:

| Platform | Formats |
|----------|---------|
| macOS    | `.dmg`, `.app` |
| Linux    | `.deb`, `.AppImage` |
| Windows  | `.msi`, `.nsis` |

The first Rust compilation can take 5–10 minutes. Subsequent builds are incremental.

### Debug and verbose builds

```bash
npm run tauri:build:debug     # Includes debug symbols
npm run tauri:build:verbose   # Verbose Rust compilation output
```

## Architecture

- **Frontend:** The exact same React app that runs in the browser. Vite builds to `dist/`.
- **Backend:** Minimal Rust wrapper in `src-tauri/src/lib.rs`. All business logic stays in the frontend.
- **PWA disabled in Tauri:** `vite.config.ts` detects `TAURI_ENV_PLATFORM` and skips the PWA plugin.
- **Platform detection:** `src/core/utils/platform.ts` exposes `isTauri()`, `isPWA()`, and `getPlatform()`.

## Known limitations

| Feature | Status in Tauri |
|---------|----------------|
| Speech Recognition (STT) | Works on Windows (WebView2/Chromium). Disabled on macOS (TCC kills non-bundled binaries). |
| Service Worker / PWA | Automatically disabled |
| Clipboard | Basic copy/paste via native WebView |
| File system access | Not needed — all data in IndexedDB |
| Auto-updater | Scaffolded but not enabled (no update server yet) |

## Troubleshooting

- **Port conflict on dev:** Ensure nothing is running on `:5173` before `tauri:dev`.
- **Cargo build fails:** Run `cd src-tauri && cargo update && cd ..` to refresh dependencies.
- **Icons missing:** Run `npx tauri icon <path-to-1024x1024.png>` to regenerate.
- **CSP errors in WebView console:** The config uses `"csp": null` (permissive). If you see CSP errors, check that the config wasn't changed.
