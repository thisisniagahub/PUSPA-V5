'use client';

import React, { useMemo } from 'react';
import { pluginRegistry } from '@/lib/plugins/core/registry';
import { PluginComponents, PluginContext } from '@/lib/plugins/core/types';
import { PluginErrorBoundary } from './ErrorBoundary';

interface PluginSlotProps {
  name: keyof PluginComponents;
  context?: Partial<PluginContext>;
}

export function PluginSlot({ name, context }: PluginSlotProps) {
  // We assume plugins are registered at boot.
  const components = useMemo(() => pluginRegistry.getComponentsForSlot(name), [name]);

  if (components.length === 0) {
    return null; // Don't render anything if no plugins use this slot
  }

  // Construct a safe context to pass down
  const safeContext: PluginContext = {
    version: '2.1.0',
    api: { log: (msg) => console.log(`[Slot ${name}]`, msg) },
    ...context,
  } as PluginContext;

  return (
    <div className="plugin-slot-container space-y-4">
      {components.map(({ id, Component }) => (
        <PluginErrorBoundary key={id} pluginId={id} slotName={name}>
          <Component context={safeContext} />
        </PluginErrorBoundary>
      ))}
    </div>
  );
}
