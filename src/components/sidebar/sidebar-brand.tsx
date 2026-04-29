'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

const BRAND_COLOR = '#ecb2ff';

export function SidebarBrand({ collapsed, onNavigateHome }: { collapsed: boolean; onNavigateHome: () => void }) {
  return (
    <button
      type="button"
      onClick={onNavigateHome}
      className={cn(
        'flex w-full items-center px-4 py-5 text-left transition-[background,transform] duration-200 ease-in-out hover:bg-muted/30 active:scale-[0.98] motion-reduce:transition-none motion-reduce:transform-none',
        collapsed ? 'justify-center' : 'gap-3',
      )}
      aria-label="Pergi ke Dashboard"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-slate-200 transition-all duration-200 hover:shadow-lg dark:bg-white dark:ring-slate-100 motion-reduce:transition-none">
        <Image 
          src="/puspa-logo-official.png" 
          alt="PUSPA Logo" 
          width={32} 
          height={32} 
          className="object-contain drop-shadow-sm" 
          priority 
          unoptimized
        />
      </span>
      <span
        className={cn(
          'flex min-w-0 flex-col overflow-hidden transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none',
          collapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100',
        )}
      >
        <span className="whitespace-nowrap text-lg font-bold tracking-tight" style={{ color: BRAND_COLOR }}>PUSPA</span>
        <span className="whitespace-nowrap text-[11px] leading-tight text-muted-foreground">Pertubuhan Urus Peduli Asnaf</span>
      </span>
    </button>
  );
}
