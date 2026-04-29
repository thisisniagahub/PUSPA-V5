'use client';

import React, { useState, useEffect } from 'react';
import { PuspaPlugin, PluginContext } from '../core/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

// Example UI Component provided by the plugin
const AnalyticsWidget = ({ context }: { context: PluginContext }) => {
  const [data, setData] = useState(0);

  useEffect(() => {
    context.api.log('Analytics Widget mounted');
    const interval = setInterval(() => setData((d) => d + Math.floor(Math.random() * 5)), 2000);
    return () => clearInterval(interval);
  }, [context.api]);

  return (
    <Card className="border-indigo-500/30 shadow-lg shadow-indigo-500/10 bg-indigo-50/50 dark:bg-indigo-950/20 backdrop-blur-xl">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Activity className="h-4 w-4" />
          Puspa Analytics Pro
        </CardTitle>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">MARKET PLUGIN</span>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mt-2">
          <div className="p-3 bg-white dark:bg-black/40 rounded-xl shadow-inner text-2xl font-bold text-indigo-700 dark:text-indigo-300">
            {data}
          </div>
          <div className="text-xs text-muted-foreground">
            Sesi aktif sedang dipantau secara langsung oleh pemalam luaran.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// The Plugin Definition
export const PuspaAnalyticsProPlugin: PuspaPlugin = {
  metadata: {
    id: 'market-analytics-pro',
    name: 'Puspa Analytics Pro',
    version: '1.0.0',
    author: 'ThirdParty Corp',
    description: 'Advanced analytics tracking and dashboard widget.',
  },
  
  // Expose UI to specific slots
  components: {
    DashboardWidgetSlot: AnalyticsWidget,
  },

  // Tap into business logic hooks
  apply: (hooks, context) => {
    hooks.onAppBoot.tap('AnalyticsPro', () => {
      context.api.log('Initializing Analytics Engine tracking...');
    });

    hooks.onDonationReceived.tap('AnalyticsPro', (donationData) => {
      context.api.log('Sending donation event to external analytics server:', donationData);
    });
  }
};
