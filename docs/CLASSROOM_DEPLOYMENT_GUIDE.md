# 🏫 Classroom Deployment Guide (`docs/CLASSROOM_DEPLOYMENT_GUIDE.md`)

Instructions for IT Administrators & Pharmacy Faculty deploying Virtual Analytical Lab.

---

## 1. Deployment Options

### Option A: Local Classroom Server (Recommended)
Run a local HTTP server in the computer lab:
```bash
npx http-server ./ -p 8000
```
Students connect via local WiFi (`http://192.168.1.X:8000`).

### Option B: Offline PWA Installation
1. Open the platform URL in Chrome/Safari.
2. Tap **Add to Home Screen** / **Install App**.
3. Service Worker (`sw.js`) caches all assets for offline laboratory practicals.
