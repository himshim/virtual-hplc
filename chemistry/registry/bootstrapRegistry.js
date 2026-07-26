import { globalEntityRegistry } from './EntityRegistry.js';
import { CHEMISTRY_MANIFEST } from './manifest.js';

export function bootstrapChemistryRegistry() {
  Object.keys(CHEMISTRY_MANIFEST).forEach(category => {
    CHEMISTRY_MANIFEST[category].forEach(entity => {
      globalEntityRegistry.register(entity);
    });
  });
  return globalEntityRegistry;
}
