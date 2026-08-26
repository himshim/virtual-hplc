# 🏫 Classroom & Campus Deployment Guide

Technical guide for IT Administrators, Lab Instructors, and Academic Technologists deploying **Virtual Analytical Lab** in computer labs, university networks, and Learning Management Systems (LMS).

---

## 1. ⚡ Architecture Highlights & Zero-Install Philosophy

- **100% Client-Side Pure Execution**: Zero server processing required. All physical simulations, FFT numerical routines, Runge-Kutta numerical models, and Canvas rendering execute inside the student's browser.
- **Zero Framework Bloat**: Pure vanilla JavaScript (ES modules), HTML5 Canvas, and modern Web Standards.
- **Offline & Low-Bandwidth Resilient**: Works without active internet once loaded.

---

## 2. 🚀 Deployment Options

### Option 1: Live Cloud Production (Zero Setup)
Direct students and faculty to the official hosted instance:
```
https://virtual-analytical-lab.vercel.app/
```
Global edge CDN delivery with instant sub-100ms load times worldwide.

---

### Option 2: Local LAN Classroom Server (Offline / Air-Gapped Labs)
For computer labs with restricted or zero internet access, spin up a lightweight local server on the instructor's workstation:

**Using Node.js:**
```bash
npx serve ./ -p 8080
```

**Using Python 3:**
```bash
python -m http.server 8080
```

Students on the local classroom Wi-Fi or Ethernet switch simply navigate to:
```
http://<INSTRUCTOR_LAN_IP>:8080
```

---

### Option 3: Progressive Web App (PWA) Offline Installation
Students can install the lab onto laptops, Chromebooks, iPads, or Android tablets:
1. Open [virtual-analytical-lab.vercel.app](https://virtual-analytical-lab.vercel.app/) in Google Chrome, Microsoft Edge, or Safari.
2. Click the **Install Virtual Analytical Lab** icon in the address bar (or *Add to Home Screen* on iOS).
3. The platform launches in standalone window mode with full offline functionality.

---

### Option 4: Learning Management System (LMS) Iframe Embedding
Embed any specific workstation or the full platform directly inside **Canvas LMS**, **Moodle**, **Blackboard Learn**, or **Google Classroom**:

#### Full Platform Embed Code:
```html
<iframe 
  src="https://virtual-analytical-lab.vercel.app/" 
  width="100%" 
  height="850px" 
  style="border:1px solid #334155; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5);" 
  allow="fullscreen" 
  title="Virtual Analytical Lab">
</iframe>
```

#### Individual Instrument Direct Embeds:
- **HPLC Chromatograph**: `https://virtual-analytical-lab.vercel.app/instruments/hplc/index.html`
- **UV-Vis Spectrophotometer**: `https://virtual-analytical-lab.vercel.app/instruments/uvvis/index.html`
- **FTIR Spectrometer**: `https://virtual-analytical-lab.vercel.app/instruments/ftir/index.html`
- **Gas Chromatograph (GC-FID)**: `https://virtual-analytical-lab.vercel.app/instruments/gc/index.html`

---

## 3. 🔒 Privacy, Security & Student Data Protection
- **FERPA & GDPR Compliant**: No student cookies, analytics tracking, user tracking, or third-party trackers.
- **Local Storage Only**: Student notebook entries and parameter histories remain in the student's browser local storage.

