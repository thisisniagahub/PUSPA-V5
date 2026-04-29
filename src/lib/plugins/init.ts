import { pluginRegistry } from './core/registry';
import { PuspaAnalyticsProPlugin } from './market/puspa-analytics-pro';

let initialized = false;

// This function should be called once when the application starts
export function initializePlugins() {
  if (initialized) return;
  
  // Register active plugins
  pluginRegistry.register(PuspaAnalyticsProPlugin);
  
  // Fire boot hooks
  pluginRegistry.boot();
  
  console.log('[App] All plugins initialized via Tapable.');
  initialized = true;
}
