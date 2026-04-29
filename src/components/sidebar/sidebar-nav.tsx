'use client';

import { ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { SidebarNavGroup } from './sidebar-types';

const BRAND_COLOR = '#ecb2ff';
const ACCENT_COLOR = '#00fbfb';

function SidebarGroupLabel({ title, collapsed }: { title: string; collapsed: boolean }) {
  return (
    <h3
      className={cn(
        'mb-1 select-none overflow-hidden font-semibold uppercase tracking-wider text-muted-foreground/50 transition-[max-height,opacity,padding,font-size] duration-300 ease-in-out motion-reduce:transition-none',
        collapsed ? 'max-h-0 px-0 text-[0px] opacity-0' : 'max-h-8 px-3 pb-1 pt-3 text-[10px] opacity-100',
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
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

export function SidebarNavItem({
  item,
  isActive,
  onNavigate,
  collapsed,
}: {
  item: SidebarNavGroup['items'][number];
  isActive: boolean;
  onNavigate: () => void;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const button = (
    <button
      type="button"
      onClick={onNavigate}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-lg text-sm font-medium transition-[background,color,box-shadow,transform] duration-200 ease-in-out motion-reduce:transition-none motion-reduce:transform-none',
        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2 pl-3.5',
        'outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2',
        isActive
          ? 'text-white shadow-md'
          : 'text-muted-foreground hover:bg-cyan-50 hover:text-cyan-700 active:scale-95 dark:hover:bg-cyan-950/30 dark:hover:text-cyan-300',
      )}
      style={isActive ? { background: `linear-gradient(135deg, ${BRAND_COLOR}, ${ACCENT_COLOR})`, boxShadow: `0 4px 12px ${BRAND_COLOR}40` } : undefined}
    >
      {isActive && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-white/80" aria-hidden="true" />}
      <Icon
        aria-hidden="true"
        className={cn(
          'h-[18px] w-[18px] shrink-0 transition-[color,transform] duration-200 motion-reduce:transition-none motion-reduce:transform-none',
          isActive ? 'text-white' : 'text-muted-foreground group-hover:scale-110 group-hover:text-foreground',
        )}
      />
      <span
        className={cn(
          'truncate whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out motion-reduce:transition-none',
          collapsed ? 'max-w-0 overflow-hidden opacity-0' : 'max-w-[180px] opacity-100',
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

export function SidebarNavGroup({
  group,
  currentView,
  onNavigate,
  collapsed,
  isLastGroup,
}: {
  group: SidebarNavGroup;
  currentView: string;
  onNavigate: (id: SidebarNavGroup['items'][number]['id']) => void;
  collapsed: boolean;
  isLastGroup: boolean;
}) {
  return (
    <div className={cn(collapsed ? 'px-2' : 'px-2.5')}>
      <SidebarGroupLabel title={group.title} collapsed={collapsed} />
      {group.subGroup && <SidebarSubGroupLabel label={group.subGroup} collapsed={collapsed} />}
      <div className="flex flex-col gap-0.5">
        {group.items.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={currentView === item.id}
            onNavigate={() => onNavigate(item.id)}
            collapsed={collapsed}
          />
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
