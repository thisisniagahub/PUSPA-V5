'use client';

import { CSSProperties, Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/auth-provider';
import { AnimatePresence, motion } from 'framer-motion';
import { Command, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';
import { useHermesStore } from '@/stores/hermes-store';
import { cn } from '@/lib/utils';

// Dynamic imports for heavy components
const AppSidebar = dynamic(() => import('@/components/sidebar/app-sidebar').then(m => ({ default: m.AppSidebar })), { ssr: false });
const CommandPalette = dynamic(() => import('@/components/command-palette').then(m => ({ default: m.CommandPalette })), { ssr: false });
const NotificationBell = dynamic(() => import('@/components/notification-bell').then(m => ({ default: m.NotificationBell })), { ssr: false });
const Aurora = dynamic(() => import('@/components/Aurora'), { ssr: false });
const ViewRenderer = dynamic(() => import('@/components/view-renderer').then(m => ({ default: m.ViewRenderer })), { ssr: false });
const HermesFab = dynamic(() => import('@/components/hermes/hermes-fab').then(m => ({ default: m.HermesFab })), { ssr: false });
const HermesDashboard = dynamic(() => import('@/components/hermes/hermes-dashboard').then(m => ({ default: m.HermesDashboard })), { ssr: false });

import { viewLabels } from '@/types';

export default function Shell() {
  const { user, loading: authLoading } = useAuth();
  const { currentView, sidebarCollapsed, toggleSidebar, setCommandPaletteOpen, setUserRole: setAppUserRole } = useAppStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { setCurrentView, setUserRole: setHermesUserRole, loadProviderConfig } = useHermesStore();

  // Constants
  const desktopSidebarWidth = sidebarCollapsed ? 80 : 280;
  const isDark = resolvedTheme === 'dark';

  // Sync Hermes state
  useEffect(() => {
    loadProviderConfig();
  }, []);

  // Mark as mounted (deferred to avoid setState in effect)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // Sync current view and user role to Hermes
  useEffect(() => {
    setCurrentView(currentView);
  }, [currentView, setCurrentView]);

  useEffect(() => {
    if (user?.role) {
      setHermesUserRole(user.role as any);
      setAppUserRole(user.role as any);
    }
  }, [user?.role, setHermesUserRole, setAppUserRole]);

  if (authLoading || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
            <Image
              src="/puspa-logo-official.png"
              alt="PUSPA"
              width={56}
              height={56}
              className="animate-pulse object-contain drop-shadow-md"
              priority
              unoptimized
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold tracking-widest text-primary uppercase">PUSPA CARE</p>
            <p className="text-xs text-muted-foreground">Menyediakan platform yang selamat...</p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure currentView is valid or default to 'dashboard'
  const safeCurrentView = currentView || 'dashboard';

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const avatarLabel = displayName.substring(0, 2).toUpperCase();
  const effectiveRole = user?.role || 'staff';

  return (
    <div className="min-h-screen flex overflow-hidden bg-background text-foreground transition-colors duration-300">
      <AppSidebar />
      
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-[margin,width] duration-300 ease-in-out overflow-y-auto overflow-x-hidden motion-reduce:transition-none lg:ml-[var(--desktop-sidebar-width)]',
        )}
        style={{ '--desktop-sidebar-width': `${desktopSidebarWidth}px` } as CSSProperties}
      >
        {/* Sticky Header with High Contrast */}
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl transition-all duration-300 border-border">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            <div className="flex items-center gap-2.5 min-w-0">
              <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={toggleSidebar} aria-label="Toggle menu">
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-2 min-w-0">
                <motion.div
                  key={safeCurrentView}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200 dark:bg-white dark:ring-slate-100">
                    <Image
                      src="/puspa-logo-official.png"
                      alt="PUSPA"
                      width={20}
                      height={20}
                      className="shrink-0 object-contain drop-shadow-sm"
                      unoptimized
                    />
                  </div>
                  <span className="font-bold truncate tracking-tight text-foreground">
                    {viewLabels[safeCurrentView] || 'Dashboard'}
                  </span>
                </motion.div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Command Palette Trigger */}
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:flex gap-2 text-xs h-8 px-3 text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground" 
                onClick={() => setCommandPaletteOpen(true)}
              >
                <Command className="h-3 w-3" />
                <span className="hidden md:inline">Cari modul…</span>
                <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border bg-muted px-1 py-0.5 font-mono text-[10px] font-normal text-muted-foreground">⌘K</kbd>
              </Button>

              {/* Theme Toggle with Contra Colors */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 shrink-0 border border-transparent hover:border-border hover:bg-accent"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                <Sun className={cn(
                  "h-4 w-4 transition-all text-foreground",
                  isDark ? "rotate-0 scale-100" : "rotate-90 scale-0"
                )} />
                <Moon className={cn(
                  "absolute h-4 w-4 transition-all text-foreground",
                  isDark ? "-rotate-90 scale-0" : "rotate-0 scale-100"
                )} />
              </Button>

              <NotificationBell />

              {/* User Profile Section */}
              <div className="flex items-center gap-2 ml-0.5 pl-2.5 border-l border-border">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
                  style={{ backgroundColor: isDark ? '#c084fc' : '#7c3aed' }}
                >
                  {avatarLabel}
                </div>
                <div className="hidden sm:flex sm:flex-col">
                  <p className="text-sm font-semibold leading-tight text-foreground">{displayName}</p>
                  <p className="text-[10px] leading-tight font-bold px-1.5 py-0.5 w-fit rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {effectiveRole === 'developer' ? 'Developer' : effectiveRole === 'admin' ? 'Pentadbir' : 'Staf'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden">
          {isDark && (
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
              <Aurora
                colorStops={['#3b0764', '#1e1b4b', '#0f172a']}
                amplitude={1.0}
              />
            </div>
          )}
          
          <div className="relative z-10 h-full overflow-auto p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <Suspense fallback={
                <div className="flex h-full items-center justify-center">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-xs text-muted-foreground font-medium">Memuatkan modul...</span>
                  </motion.div>
                </div>
              }>
                <div key={safeCurrentView} className="h-full">
                  <ViewRenderer view={safeCurrentView} />
                </div>
              </Suspense>
            </AnimatePresence>
          </div>
        </main>

        <footer className="border-t py-3 px-6 bg-muted/30 border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground font-medium">
              &copy; {new Date().getFullYear()} PUSPA (Pertubuhan Urus Peduli Asnaf). Hak Cipta Terpelihara.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sistem Stabil v3.2.0-prod
              </span>
            </div>
          </div>
        </footer>
      </div>

      <CommandPalette />
      <HermesFab />
      <HermesDashboard />
    </div>
  );
}
