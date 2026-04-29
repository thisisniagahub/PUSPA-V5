'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { X } from 'lucide-react';
import { normalizeUserRole } from '@/lib/auth-shared';
import { useAppStore } from '@/stores/app-store';
import type { ViewId } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarBrand } from './sidebar-brand';
import { SidebarFooter } from './sidebar-footer';
import { getVisibleGroups } from './sidebar-config';
import { SidebarNavGroup } from './sidebar-nav';

export function SidebarContent({
  onNavigate,
  onClose,
  collapsed = false,
}: {
  onNavigate: (id: ViewId) => void;
  onClose?: () => void;
  collapsed?: boolean;
}) {
  const currentView = useAppStore((s) => s.currentView);
  const userRole = useAppStore((s) => s.userRole);
  const setUserRole = useAppStore((s) => s.setUserRole);
  const { user } = useAuth();

  const effectiveRole = normalizeUserRole(user?.role || userRole);
  const visibleGroups = getVisibleGroups(effectiveRole);

  useEffect(() => {
    if (userRole !== effectiveRole) setUserRole(effectiveRole);
  }, [effectiveRole, setUserRole, userRole]);

  const handleNavigate = (id: ViewId) => {
    onNavigate(id);
    onClose?.();
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative flex h-full flex-col overflow-hidden border-r border-white/10 bg-card backdrop-blur-xl">
        <SidebarBrand collapsed={collapsed} onNavigateHome={() => handleNavigate('dashboard')} />

        {onClose && (
          <div className="absolute right-3 top-5 z-10">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClose} aria-label="Tutup menu">
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        )}

        <Separator className="mx-4" />
        <ScrollArea className="min-h-0 flex-1 py-1">
          <nav className="flex flex-col gap-0" aria-label="Navigasi utama">
            {visibleGroups.map((group, idx) => (
              <SidebarNavGroup
                key={group.title}
                group={group}
                currentView={currentView}
                onNavigate={handleNavigate}
                collapsed={collapsed}
                isLastGroup={idx === visibleGroups.length - 1}
              />
            ))}
          </nav>
        </ScrollArea>
        <Separator className="mx-4" />
        <SidebarFooter
          collapsed={collapsed}
          role={effectiveRole}
          userLabel={user?.name || user?.email || 'Pengguna PUSPA'}
        />
      </div>
    </TooltipProvider>
  );
}
