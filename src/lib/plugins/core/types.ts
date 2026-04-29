import { ComponentType } from 'react';
import { SyncHook, AsyncSeriesWaterfallHook } from 'tapable';

// 1. Context that is passed to every plugin
export interface PluginContext {
  version: string;
  user?: { id: string; role: string; name: string };
  api: {
    log: (message: string, data?: any) => void;
  };
}

// 2. Metadata for the plugin
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
}

// 3. UI Slots definition (where plugins can inject components)
export interface PluginComponents {
  DashboardWidgetSlot?: ComponentType<{ context: PluginContext }>;
  SidebarBottomSlot?: ComponentType<{ context: PluginContext }>;
  ProfileTabSlot?: ComponentType<{ context: PluginContext }>;
}

// 4. The actual Plugin Interface
export interface PuspaPlugin {
  metadata: PluginMetadata;
  
  // UI Components the plugin provides
  components?: PluginComponents;

  // Logic Hooks: Allows plugins to hook into system events
  apply?: (hooks: PluginHooks, context: PluginContext) => void;
}

// 5. Definition of all system hooks (Lifecycle & Business Logic)
export interface PluginHooks {
  // Triggered when a new case is created. Plugins can modify the case object before save.
  beforeCaseCreate: AsyncSeriesWaterfallHook<[any]>;
  
  // Triggered after a donation is received (read-only notification)
  onDonationReceived: SyncHook<[any]>;
  
  // Triggered when the app starts
  onAppBoot: SyncHook<[]>;
}
