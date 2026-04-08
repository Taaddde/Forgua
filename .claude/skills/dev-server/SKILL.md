---
name: dev-server
description: "Start, verify, and debug the Forgua development server. Use whenever the user asks to run the app, start the dev server, check if the app is working, debug a build error, or verify the app compiles. Also trigger on 'npm run dev', 'start the app', 'check if it builds', or 'fix build errors'."
---

# Dev Server Management

Manages the Forgua Vite development server — start, verify, and debug.

## Starting the dev server

```bash
npm run dev
```

The app runs at `http://localhost:5173`. To verify it's working, either:
- Use the Playwright MCP to navigate to the URL and take a screenshot
- Use `curl -s http://localhost:5173 | head -20` to check the HTML response

## Build verification

Before starting the server, always run a quick TypeScript check:

```bash
npx tsc -b
```

If there are errors, fix them before starting the dev server.

## Common issues and fixes

### "Module not found" errors
- Check that the import path uses `@/` alias or relative paths
- Run `npm install` if a dependency is missing

### TypeScript errors
- `erasableSyntaxOnly` — don't use `enum`, use `const` objects with `as const` instead
- `noUnusedLocals` — prefix unused params with `_` (e.g., `_text`)
- Strict null checks — always handle `null | undefined` cases

### Tailwind not working
- Ensure `@import "tailwindcss"` is in `src/index.css`
- Ensure `@tailwindcss/vite` is in `vite.config.ts` plugins

### PWA issues
- Check `vite.config.ts` has `VitePWA` plugin configured
- For dev, PWA service worker is disabled by default (only in build)

## Build for production

```bash
npx vite build --outDir dist
```

Note: In sandbox environments, you may need `--outDir /tmp/forgua-build` due to filesystem permissions.

## Port conflicts

If port 5173 is in use:
```bash
npx vite --port 5174
```
