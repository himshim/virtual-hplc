/**
 * SettingsService.js — Platform Application Settings & Feature Flags Service
 */

export class SettingsService {
  constructor() {
    this.settings = {
      projectionMode: false,
      darkTheme: true,
      audioEnabled: false,
      debugTelemetry: false,
      speedMultiplier: 1
    };
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    this.settings[key] = value;
  }

  toggle(key) {
    this.settings[key] = !this.settings[key];
    return this.settings[key];
  }

  getAll() {
    return { ...this.settings };
  }
}

export const settingsService = new SettingsService();
