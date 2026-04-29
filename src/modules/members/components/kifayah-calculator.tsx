'use client';

import React from 'react';
import { Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface KifayahCalculatorProps {
  member: {
    householdSize: number;
    monthlyIncome: number;
  };
}

export function KifayahCalculator({ member }: KifayahCalculatorProps) {
  // Mock logic based on Selangor LZS guidelines (2024 simplified)
  const baseHousehold = 1180; // Ketua + Isteri
  const childAllowance = 250;
  const totalAllowance = baseHousehold + ((member.householdSize - 2) * childAllowance);
  const hadKifayah = Math.max(baseHousehold, totalAllowance);
  const deficit = hadKifayah - member.monthlyIncome;

  const status = deficit > 500 ? 'Fakir' : (deficit > 0 ? 'Miskin' : 'Tidak Layak');
  const badgeColor = deficit > 500 ? 'bg-red-500' : (deficit > 0 ? 'bg-amber-500' : 'bg-slate-500');

  return (
    <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/30 dark:bg-indigo-950/20">
      <div className="flex items-center justify-between mb-3">
        <h5 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
          <Calculator className="h-4 w-4" /> Analisis Had Kifayah (Auto)
        </h5>
        <Badge className={badgeColor}>{status}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Anggaran Had Kifayah</p>
          <p className="font-mono font-bold text-slate-700 dark:text-slate-300">RM {hadKifayah}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pendapatan Isi Rumah</p>
          <p className="font-mono font-bold text-slate-700 dark:text-slate-300">RM {member.monthlyIncome}</p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-800 flex justify-between items-center">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Defisit Kewangan:</p>
          <p className={`font-mono font-bold ${deficit > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600"}`}>
            {deficit > 0 ? `-RM ${deficit}` : "+RM " + Math.abs(deficit)}
        </p>
      </div>
    </div>
  );
}
