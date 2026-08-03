/**
 * ManifestValidator.js — Automated Plugin Manifest Schema & Cross-Field Validator
 *
 * Validates plugin manifests for:
 * 1. Required schema fields (id, sdkVersion, features, contributes)
 * 2. Semver version syntax (e.g. "1.0.0")
 * 3. Cross-field consistency rules (e.g. features.graph.type requires contributes.hero)
 */

export class ManifestValidator {
  /**
   * Validates a plugin manifest object
   * @param {Object} manifest
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validate(manifest) {
    const errors = [];

    if (!manifest || typeof manifest !== 'object') {
      return { valid: false, errors: ['Manifest must be a non-null JSON object.'] };
    }

    // Required String Fields
    const requiredStrings = ['id', 'name', 'category', 'sdkVersion', 'pluginVersion', 'entry'];
    requiredStrings.forEach(field => {
      if (!manifest[field] || typeof manifest[field] !== 'string') {
        errors.push(`Missing or invalid string field '${field}'.`);
      }
    });

    // ID Syntax check
    if (manifest.id && !/^[a-z0-9_-]+$/.test(manifest.id)) {
      errors.push(`Plugin ID '${manifest.id}' contains invalid characters (must be lowercase alphanumeric, dash, or underscore).`);
    }

    // Semver format check
    const semverRegex = /^[0-9]+\.[0-9]+\.[0-9]+$/;
    if (manifest.sdkVersion && !semverRegex.test(manifest.sdkVersion)) {
      errors.push(`sdkVersion '${manifest.sdkVersion}' is not valid semver (x.y.z).`);
    }
    if (manifest.pluginVersion && !semverRegex.test(manifest.pluginVersion)) {
      errors.push(`pluginVersion '${manifest.pluginVersion}' is not valid semver (x.y.z).`);
    }

    // Features Object validation
    if (!manifest.features || typeof manifest.features !== 'object') {
      errors.push('Missing or invalid "features" object.');
    } else {
      if (!manifest.features.graph || typeof manifest.features.graph.type !== 'string') {
        errors.push('features.graph must define a valid string "type".');
      }
    }

    // Contributes Object validation
    if (!manifest.contributes || typeof manifest.contributes !== 'object') {
      errors.push('Missing or invalid "contributes" object.');
    }

    // Cross-Field Consistency Validation
    if (manifest.features?.graph?.type && manifest.features.graph.type !== 'none') {
      if (!manifest.contributes?.hero) {
        errors.push(`Cross-field error: features.graph.type '${manifest.features.graph.type}' requires contributes.hero to be defined.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
