'use client';

import React from 'react';
import { CheckCircle, Banknote, MapPin, Package, Bot } from 'lucide-react';

interface TimelineEvent {
  date: string;
  title: string;
  type: 'system' | 'payment' | 'field' | 'distribution' | 'bot';
  icon: React.ReactNode;
}

export function HistoryTimeline() {
  const events: TimelineEvent[] = [
    { date: '12 Mac 2026', title: 'Permohonan Bantuan Diluluskan', type: 'system', icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> },
    { date: '15 Mac 2026', title: 'Pembayaran Zakat Dikreditkan (RM500)', type: 'payment', icon: <Banknote className="h-4 w-4 text-indigo-500" /> },
    { date: '02 Apr 2026', title: 'Siasatan Lapangan Selesai', type: 'field', icon: <MapPin className="h-4 w-4 text-amber-500" /> },
    { date: '10 Apr 2026', title: 'Agihan Bakul Makanan Diserahkan', type: 'distribution', icon: <Package className="h-4 w-4 text-blue-500" /> },
    { date: '26 Apr 2026', title: 'Sync eCoss Berjaya (RPA Bot)', type: 'bot', icon: <Bot className="h-4 w-4 text-fuchsia-500" /> },
  ];

  return (
    <div className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6 mt-4">
      {events.map((event, i) => (
        <div key={i} className="relative pl-6">
          <span className="absolute -left-3 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
            {event.icon}
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{event.date}</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">{event.title}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
