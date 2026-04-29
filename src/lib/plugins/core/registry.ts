import { SyncHook, AsyncSeriesWaterfallHook } from 'tapable';
import { PuspaPlugin, PluginHooks, PluginContext, PluginComponents } from './types';

class PluginRegistry {
  private plugins: Map<string, PuspaPlugin> = new Map();
  private initialized = false;

  // The Tapable hooks instance
  public hooks: PluginHooks = {
    beforeCaseCreate: new AsyncSeriesWaterfallHook(['caseData']),
    onDonationReceived: new SyncHook(['donationData']),
    onAppBoot: new SyncHook(),
  };

  private getGlobalContext(): PluginContext {
    return {
      version: '2.1.0',
      api: {
        log: (msg, data) => console.log(`[Plugin System] ${msg}`, data || ''),
      }
    };
  }

  public register(plugin: PuspaPlugin) {
    if (this.plugins.has(plugin.metadata.id)) {
      console.warn(`Plugin ${plugin.metadata.id} is already registered. Skipping.`);
      return;
    }

    this.plugins.set(plugin.metadata.id, plugin);
    
    // Wire up the Tapable hooks if the plugin uses them
    if (plugin.apply) {
      plugin.apply(this.hooks, this.getGlobalContext());
    }

    console.log(`[Registry] Loaded plugin: ${plugin.metadata.name} v${plugin.metadata.version}`);
  }

  public boot() {
    if (this.initialized) return;
    this.hooks.onAppBoot.call();
    this.initialized = true;
  }

  public getPlugins() {
    return Array.from(this.plugins.values());
  }

  public getComponentsForSlot(slotName: keyof PluginComponents) {
    return this.getPlugins()
      .filter((p) => p.components && p.components[slotName])
      .map((p) => ({
        id: p.metadata.id,
        Component: p.components![slotName]!,
      }));
  }
}

// Export a singleton instance of the registry
export const pluginRegistry = new PluginRegistry();
