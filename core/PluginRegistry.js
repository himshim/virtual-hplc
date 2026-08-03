/**
 * PluginRegistry.js — Centralized Platform Plugin Registry
 *
 * Registers, activates, queries, and disposes analytical instrument plugins.
 * Eliminates all hardcoded instrument branching across platform controllers.
 */

import { PLATFORM_SDK_VERSION } from './AnalyticalInstrumentPlugin.js';
import { ManifestValidator } from './ManifestValidator.js';


export class PluginRegistry {

  constructor() {
    this.plugins = new Map();
    this.activePluginId = null;
  }

  /**
   * Register a new plugin instance
   * @param {AnalyticalInstrumentPlugin} plugin
   */
  register(plugin) {
    if (!plugin || !plugin.id) {
      console.warn('[PluginRegistry] Rejected invalid plugin registration: Missing plugin ID.');
      return false;
    }

    // Manifest Schema & Cross-Field Validation
    if (plugin.manifest) {
      const { valid, errors } = ManifestValidator.validate(plugin.manifest);
      if (!valid) {
        console.warn(`[PluginRegistry] Rejected plugin '${plugin.id}': Manifest schema validation failed.`, errors);
        return false;
      }
    }

    const platformMajor = parseInt(PLATFORM_SDK_VERSION.split('.')[0], 10);
    const pluginSdkMajor = parseInt((plugin.sdkVersion || '1.0.0').split('.')[0], 10);

    if (pluginSdkMajor > platformMajor) {
      console.warn(`[PluginRegistry] Rejected plugin '${plugin.id}': Requires SDK v${plugin.sdkVersion}, but platform SDK is v${PLATFORM_SDK_VERSION}.`);
      return false;
    }

    this.plugins.set(plugin.id, plugin);
    return true;
  }



  /**
   * Unregister and dispose a plugin
   * @param {string} pluginId
   */
  unregister(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.dispose();
      this.plugins.delete(pluginId);
    }
  }

  /** Get registered plugin by ID */
  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }

  /** List all registered plugin manifests */
  listPlugins() {
    return Array.from(this.plugins.values()).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      version: p.pluginVersion,
      features: p.features,
      contributes: p.contributes
    }));
  }

  /** Set currently active instrument plugin */
  setActive(pluginId) {
    if (!this.plugins.has(pluginId)) {
      console.warn(`[PluginRegistry] Plugin ID '${pluginId}' is not registered.`);
      return null;
    }
    this.activePluginId = pluginId;
    const active = this.plugins.get(pluginId);
    try {
      active.initialize();
      return active;
    } catch (err) {
      console.error(`[PluginRegistry] Error initializing plugin '${pluginId}':`, err);
      active.lifecycleState = 'ERROR';
      return null;
    }
  }

  /** Get currently active plugin */
  getActive() {
    return this.activePluginId ? this.plugins.get(this.activePluginId) : null;
  }

  /** Dispose all registered plugins */
  disposeAll() {
    this.plugins.forEach(plugin => plugin.dispose());
    this.plugins.clear();
    this.activePluginId = null;
  }
}

export const platformPluginRegistry = new PluginRegistry();
