'use client';

import { useEffect, useCallback, useSyncExternalStore } from 'react';
import { useAuth } from '@/components/auth-provider';
import Image from 'next/image';
import {
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { normalizeUserRole } from '@/lib/auth-shared';
import { useAppStore, type UserRole } from '@/stores/app-store';
import type { ViewId } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  ROLE_CONFIG,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
  getVisibleGroups,
} from './sidebar-config';
import type { SidebarNavGroup, SidebarNavItem as SidebarNavItemType } from './sidebar-types';

const BRAND_COLOR = '#ecb2ff';
const ACCENT_COLOR = '#00fbfb';

function SidebarBrand({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: (id: ViewId) => void }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate('dashboard')}
      className={cn(
        'flex w-full items-center px-4 py-5 text-left transition-[background,transform] duration-200 ease-in-out hover:bg-muted/30 active:scale-[0.98] motion-reduce:transition-none motion-reduce:transform-none',
        'outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2',
        collapsed ? 'justify-center' : 'gap-3',
      )}
      aria-label="Ke Dashboard PUSPA"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-cyan-100 transition-shadow duration-200 dark:bg-cyan-950/50 dark:ring-cyan-800/50 motion-reduce:transition-none">
        <Image src="/puspa-logo-official.png" alt="PUSPA Logo" width={40} height={40} className="object-contain" priority />
      </div>
      <div
        className={cn(
          'flex min-w-0 flex-col overflow-hidden transition-[max-height,max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none',
          collapsed ? 'max-h-0 max-w-0 opacity-0' : 'max-h-20 max-w-[200px] opacity-100',
        )}
      >
        <span className="whitespace-nowrap text-lg font-bold tracking-tight" style={{ color: BRAND_COLOR }}>PUSPA</span>
        <span className="truncate text-[11px] leading-tight text-muted-foreground">Pertubuhan Urus Peduli Asnaf</span>
      </div>
    </button>
  );
}

function SidebarNavItem({ item, isActive, onClick, collapsed }: { item: SidebarNavItemType; isActive: boolean; onClick: () => void; collapsed: boolean }) {
  const Icon = item.icon;
  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-lg text-sm font-medium transition-[background,color,box-shadow,transform] duration-200 ease-in-out motion-reduce:transition-none motion-reduce:transform-none',
        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2 pl-3.5',
        'outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2',
        isActive ? 'text-white shadow-md' : 'text-muted-foreground hover:bg-cyan-50 hover:text-cyan-700 active:scale-95 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-300',
      )}
      style={isActive ? { background: `linear-gradient(135deg, ${BRAND_COLOR}, ${ACCENT_COLOR})`, boxShadow: `0 4px 12px ${BRAND_COLOR}40` } : undefined}
    >
      {isActive && <span aria-hidden="true" className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-white/80" />}
      <Icon
        aria-hidden="true"
        className={cn(
          'h-[18px] w-[18px] shrink-0 transition-[color,transform] duration-200 motion-reduce:transition-none motion-reduce:transform-none',
          isActive ? 'text-white' : 'text-muted-foreground group-hover:scale-110 group-hover:text-foreground',
        )}
      />
      <span
        className={cn(
          'min-w-0 truncate whitespace-nowrap transition-[max-height,max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none',
          collapsed ? 'max-h-0 max-w-0 overflow-hidden opacity-0' : 'max-h-6 max-w-[180px] opacity-100',
        )}
      >
        {item.label}
      </span>
    </button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8} className="font-medium">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarGroupLabel({ title, collapsed }: { title: string; collapsed: boolean }) {
  return (
    <h3
      className={cn(
        'mb-1 select-none font-semibold uppercase tracking-wider text-muted-foreground/50 transition-[max-height,opacity,padding,font-size] duration-300 ease-in-out motion-reduce:transition-none',
        collapsed ? 'max-h-0 overflow-hidden px-0 text-[0px] opacity-0' : 'px-3 pb-1 pt-3 text-[10px] opacity-100',
      )}
    >
      {title}
    </h3>
  );
}

function SidebarSubGroupLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center py-1.5" aria-label={label}>
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted/60">
              <span className="text-[8px] font-bold text-muted-foreground">AI</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} className="text-xs font-medium">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex select-none items-center gap-2 px-3 pb-1 pt-4">
      <div className="flex items-center gap-1.5 text-muted-foreground/70">
        <ChevronRight aria-hidden="true" className="h-3 w-3" />
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div aria-hidden="true" className="h-px flex-1 bg-border/60" />
    </div>
  );
}

function SidebarNavGroup({ group, currentView, onNavigate, collapsed, isLastGroup }: { group: SidebarNavGroup; currentView: ViewId; onNavigate: (id: ViewId) => void; collapsed: boolean; isLastGroup: boolean }) {
  return (
    <div className={cn(collapsed ? 'px-2' : 'px-2.5')}>
      <SidebarGroupLabel title={group.title} collapsed={collapsed} />
      {group.subGroup && <SidebarSubGroupLabel label={group.subGroup} collapsed={collapsed} />}
      <div className="flex flex-col gap-0.5">
        {group.items.map((item) => (
          <SidebarNavItem key={item.id} item={item} isActive={currentView === item.id} onClick={() => onNavigate(item.id)} collapsed={collapsed} />
        ))}
      </div>
      {!isLastGroup && (
        <div className={cn('my-2 transition-[width,margin] duration-300 motion-reduce:transition-none', collapsed ? 'mx-auto w-6' : 'w-full')}>
          <Separator className="bg-border/40" />
        </div>
      )}
    </div>
  );
}

function SidebarFooter({ collapsed, role, userLabel, onSignOut }: { collapsed: boolean; role: UserRole; userLabel: string; onSignOut: () => void }) {
  const config = ROLE_CONFIG[role];
  const avatarLabel = userLabel.trim().charAt(0).toUpperCase() || 'P';

  return (
    <div className={cn('px-4 py-3 transition-[padding] duration-300 motion-reduce:transition-none', collapsed ? 'flex flex-col items-center gap-2' : 'space-y-2')}>
      <div className={cn('flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2', collapsed && 'justify-center')}>
        <div className={cn('flex shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-bold dark:bg-cyan-950/40', collapsed ? 'h-8 w-8' : 'h-9 w-9')} style={{ color: BRAND_COLOR }}>
          {avatarLabel}
        </div>
        <div className={cn('flex min-w-0 flex-col overflow-hidden transition-[max-height,max-width,opacity] duration-300 motion-reduce:transition-none', collapsed ? 'max-h-0 max-w-0 opacity-0' : 'max-h-12 max-w-[160px] opacity-100')}>
          <span className="truncate text-[11px] font-semibold text-foreground">{userLabel}</span>
          <span className="truncate text-[10px] text-muted-foreground">{config.label} · {config.description}</span>
        </div>
      </div>

      <Button type="button" variant="outline" size={collapsed ? 'icon' : 'sm'} className={cn('w-full border-border/70', collapsed ? 'h-9 w-9' : 'justify-start gap-2')} onClick={onSignOut} aria-label="Log keluar">
        <LogOut aria-hidden="true" className="h-4 w-4" />
        {!collapsed && <span>Log keluar</span>}
      </Button>

      <Separator className="bg-border/40" />
      <div className={cn('flex items-center gap-3 overflow-hidden transition-[opacity] duration-300 motion-reduce:transition-none', collapsed && 'justify-center')}>
        <div className={cn('flex shrink-0 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/40', collapsed ? 'h-7 w-7' : 'h-8 w-8')}>
          <Image src="/puspa-logo-official.png" alt="PUSPA" width={collapsed ? 16 : 20} height={collapsed ? 16 : 20} className="object-contain" />
        </div>
        <div className={cn('flex flex-col gap-0.5 overflow-hidden transition-[max-height,max-width,opacity] duration-300 motion-reduce:transition-none', collapsed ? 'max-h-0 max-w-0 opacity-0' : 'max-h-10 max-w-[180px] opacity-100')}>
          <span className="whitespace-nowrap text-[11px] font-semibold" style={{ color: BRAND_COLOR }}>PUSPA KL & Selangor</span>
          <span className="whitespace-nowrap text-[10px] text-muted-foreground">v2.1.0</span>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate, onClose, collapsed }: { onNavigate: (id: ViewId) => void; onClose?: () => void; collapsed?: boolean }) {
  const currentView = useAppStore((s) => s.currentView);
  const userRole = useAppStore((s) => s.userRole);
  const setUserRole = useAppStore((s) => s.setUserRole);
  const { user: authUser, signOut } = useAuth();
  const isCollapsed = !!collapsed;
  const effectiveRole = normalizeUserRole(authUser?.role || userRole);
  const visibleGroups = getVisibleGroups(effectiveRole);

  useEffect(() => {
    if (userRole !== effectiveRole) setUserRole(effectiveRole);
  }, [effectiveRole, setUserRole, userRole]);

  const handleNavigate = (id: ViewId) => {
    onNavigate(id);
    onClose?.();
  };

  const handleSignOut = () => {
    void signOut();
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative flex h-full flex-col overflow-hidden border-r border-white/10 bg-card backdrop-blur-xl">
        <SidebarBrand collapsed={isCollapsed} onNavigate={handleNavigate} />
        {onClose && (
          <div className="absolute right-3 top-5 z-10">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClose} aria-label="Tutup menu">
              <X aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        )}
        <Separator className="mx-4" />
        <ScrollArea className="min-h-0 flex-1 py-1">
          <nav className="flex flex-col gap-0" aria-label="Navigasi utama">
            {visibleGroups.map((group, idx) => (
              <SidebarNavGroup key={group.title} group={group} currentView={currentView} onNavigate={handleNavigate} collapsed={isCollapsed} isLastGroup={idx === visibleGroups.length - 1} />
            ))}
          </nav>
        </ScrollArea>
        <Separator className="mx-4" />
        <SidebarFooter collapsed={isCollapsed} role={effectiveRole} userLabel={authUser?.name || authUser?.email || 'Pengguna PUSPA'} onSignOut={handleSignOut} />
      </div>
    </TooltipProvider>
  );
}

function useIsDesktop() {
  const subscribe = useCallback((cb: () => void) => {
    const mq = window.matchMedia('(min-width: 1024px)');
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia('(min-width: 1024px)').matches,
    () => false,
  );
}

export function AppSidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const setView = useAppStore((s) => s.setView);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop, setSidebarOpen]);

  const width = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  return (
    <>
      {!isDesktop && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[280px] p-0" aria-describedby={undefined}>
            <SheetTitle className="sr-only">Menu Navigasi PUSPA</SheetTitle>
            <SidebarContent onNavigate={setView} onClose={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <aside
        className="fixed inset-y-0 left-0 z-50 hidden border-r border-border bg-card lg:flex lg:flex-col lg:transition-[width] lg:duration-300 lg:ease-in-out motion-reduce:transition-none"
        style={{ width }}
        aria-label="Sidebar navigasi"
      >
        <SidebarContent onNavigate={setView} collapsed={sidebarCollapsed} />
        <div className="absolute -right-3 top-7 z-50 hidden lg:flex">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full border bg-background shadow-md transition-[background,transform] duration-200 hover:bg-muted motion-reduce:transition-none motion-reduce:transform-none"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Kecilkan sidebar'}
            aria-pressed={!sidebarCollapsed}
          >
            {sidebarCollapsed ? <PanelLeftOpen aria-hidden="true" className="h-3 w-3" /> : <PanelLeftClose aria-hidden="true" className="h-3 w-3" />}
          </Button>
        </div>
      </aside>
    </>
  );
}

export default AppSidebar;
