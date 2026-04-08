# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please report it by emailing the maintainer directly. You can find contact information on the [GitHub profile](https://github.com/taaddde).

Please include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

You should receive a response within 72 hours. If the issue is confirmed, a fix will be released as soon as possible.

## Scope

LinguaForge runs entirely in the user's browser or as a local desktop app (Tauri). All data stays on the user's device via IndexedDB. There is no server, no user accounts, and no network requests beyond fetching the app itself. The attack surface is intentionally minimal.
