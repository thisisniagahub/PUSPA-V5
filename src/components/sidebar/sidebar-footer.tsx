'use client';

import Image from 'next/image';
import { useAuth } from '@/components/auth-provider';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/stores/app-store';
import { ROLE_CONFIG } from './sidebar-config';

const BRAND_COLOR = '#ecb2ff';

export function SidebarFooter({ collapsed, role, userLabel }: { collapsed: boolean; role: UserRole; userLabel: string }) {
  const config = ROLE_CONFIG[role];
  const avatarLabel = userLabel.trim().charAt(0).toUpperCase() || 'P';
  const { signOut } = useAuth();

  return (
    <div className={cn('px-4 py-3 transition-[padding] duration-300 motion-reduce:transition-none', collapsed ? 'flex flex-col items-center gap-2' : 'space-y-2')}>
      <div className={cn('flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2', collapsed && 'justify-center')}>
        <div
          className={cn('flex shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-bold dark:bg-cyan-950/40', collapsed ? 'h-8 w-8' : 'h-9 w-9')}
          style={{ color: BRAND_COLOR }}
          aria-hidden="true"
        >
          {avatarLabel}
        </div>
        <div
          className={cn(
            'flex min-w-0 flex-col overflow-hidden transition-[max-width,opacity] duration-300 motion-reduce:transition-none',
            collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100',
          )}
        >
          <span className="truncate text-[11px] font-semibold text-foreground">{userLabel}</span>
          <span className="truncate text-[10px] text-muted-foreground">{config.label} · {config.description}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size={collapsed ? 'icon' : 'sm'}
        className={cn('w-full border-border/70', collapsed ? 'h-9 w-9' : 'justify-start gap-2')}
        onClick={() => void signOut()}
        aria-label="Log keluar"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {!collapsed && <span>Log keluar</span>}
      </Button>

      <Separator className="bg-border/40" />
      <div className={cn('flex items-center gap-3 overflow-hidden transition-[gap] duration-300 motion-reduce:transition-none', collapsed && 'justify-center')}>
        <div className={cn('flex shrink-0 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/40', collapsed ? 'h-7 w-7' : 'h-8 w-8')}>
          <Image src="/puspa-logo-official.png" alt="PUSPA" width={collapsed ? 16 : 20} height={collapsed ? 16 : 20} className="object-contain" />
        </div>
        <div
          className={cn(
            'flex flex-col gap-0.5 overflow-hidden transition-[max-width,opacity] duration-300 motion-reduce:transition-none',
            collapsed ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100',
          )}
        >
          <span className="whitespace-nowrap text-[11px] font-semibold" style={{ color: BRAND_COLOR }}>PUSPA KL & Selangor</span>
          <span className="whitespace-nowrap text-[10px] text-muted-foreground">v2.1.0</span>
        </div>
      </div>
    </div>
  );
}
