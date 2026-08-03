# 📘 Plugin Author Guide — LabPlugin SDK v1

Welcome to the **Virtual Analytical Lab Plugin Author Guide**. This guide explains how to create, test, and register a new analytical instrument plugin (e.g., GC, FTIR, Dissolution, Polarimetry) using **LabPlugin SDK v1**.

---

## 1. Quick Start: 4 Steps to Build an Instrument Plugin

```
Step 1: Create Directory      instruments/<plugin-id>/
Step 2: Write Manifest        instruments/<plugin-id>/manifest.json
Step 3: Implement Plugin SDK  instruments/<plugin-id>/<PluginName>.js
Step 4: Register in Registry  platformPluginRegistry.register(plugin)
```

---

## 2. Directory Structure Conventions

Create a dedicated directory under `instruments/`:

```text
instruments/
└── ftir/
    ├── manifest.json                  # Plugin Manifest Descriptor
    ├── FtirPlugin.js                  # Subclass of AnalyticalInstrumentPlugin
    ├── controller/
    │   └── FtirController.js          # Headless State Controller (0 DOM calls)
    ├── engine/
    │   └── interferogramEngine.js     # Physics / Optics Calculation Engine
    ├── education/
    │   └── FtirEducationalEngine.js   # Centralized Pedagogical Explanations
    ├── index.html                     # Primary Instrument Landing View
    └── assets/                        # SVGs, spectra data, chemical structures
```

---

## 3. Writing `manifest.json`

Every plugin MUST include a `manifest.json` conforming to `core/manifest.schema.json`:

```json
{
  "sdkVersion": "1.0.0",
  "id": "ftir",
  "name": "Fourier-Transform Infrared Spectrometer (FTIR)",
  "category": "Spectroscopy",
  "pluginVersion": "1.0.0",
  "entry": "index.html",
  "requires": {
    "platform": ">=1.0.0",
    "chart": ">=4.0.0"
  },
  "features": {
    "graph": {
      "type": "interferogram",
      "live": true,
      "zoom": true,
      "compare": true
    },
    "education": {
      "prediction": true,
      "notebook": true,
      "replay": false
    },
    "reporting": {
      "export": true
    }
  },
  "contributes": {
    "telemetry": true,
    "hero": "interferogram",
    "toolbar": true,
    "bottomSheet": true
  }
}
```

---

## 4. Implementing the Plugin Subclass

Extend `AnalyticalInstrumentPlugin` from `core/AnalyticalInstrumentPlugin.js`:

```javascript
import { AnalyticalInstrumentPlugin } from '../../core/AnalyticalInstrumentPlugin.js';
import manifest from './manifest.json' with { type: 'json' };

export class FtirPlugin extends AnalyticalInstrumentPlugin {
  constructor() {
    super(manifest);
    this.controller = null;
  }

  async initialize() {
    super.initialize();
    const { FtirController } = await import('./controller/FtirController.js');
    this.controller = new FtirController();
    return this.controller;
  }

  getController() {
    return this.controller;
  }

  dispose() {
    if (this.controller && this.controller.dispose) {
      this.controller.dispose();
    }
    super.dispose();
  }
}
```

---

## 5. Registering Your Plugin

In your entry point script, register your plugin with the central `platformPluginRegistry`:

```javascript
import { platformPluginRegistry } from './core/PluginRegistry.js';
import { FtirPlugin } from './instruments/ftir/FtirPlugin.js';

const ftirPlugin = new FtirPlugin();
platformPluginRegistry.register(ftirPlugin);
platformPluginRegistry.setActive('ftir');
```

---

## 6. Core Rules & Guidelines

- **Headless Controllers**: Controllers MUST NOT contain any DOM queries (`document.getElementById`, `querySelector`). State communication happens via `EventBus`.
- **Resource Disposal**: Override `dispose()` to destroy Chart.js instances, clear timers, and unsubscribe event listeners to prevent memory leaks.
- **Manifest Validation**: All manifests are validated automatically on registration via `ManifestValidator`.
