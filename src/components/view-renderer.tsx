'use client';

import dynamic from 'next/dynamic';
import type { ViewId } from '@/types';

// Dynamic imports for all module pages to reduce initial bundle size
const moduleLoaders: Record<ViewId, React.ComponentType> = {
  'dashboard': dynamic(() => import('@/modules/dashboard/page'), { ssr: false }),
  'members': dynamic(() => import('@/modules/members/page'), { ssr: false }),
  'cases': dynamic(() => import('@/modules/cases/page'), { ssr: false }),
  'programmes': dynamic(() => import('@/modules/programmes/page'), { ssr: false }),
  'donations': dynamic(() => import('@/modules/donations/page'), { ssr: false }),
  'disbursements': dynamic(() => import('@/modules/disbursements/page'), { ssr: false }),
  'compliance': dynamic(() => import('@/modules/compliance/page'), { ssr: false }),
  'admin': dynamic(() => import('@/modules/admin/page'), { ssr: false }),
  'reports': dynamic(() => import('@/modules/reports/page'), { ssr: false }),
  'activities': dynamic(() => import('@/modules/activities/page'), { ssr: false }),
  'ai': dynamic(() => import('@/modules/ai/page'), { ssr: false }),
  'volunteers': dynamic(() => import('@/modules/volunteers/page'), { ssr: false }),
  'donors': dynamic(() => import('@/modules/donors/page'), { ssr: false }),
  'documents': dynamic(() => import('@/modules/documents/page'), { ssr: false }),
  'openclaw-mcp': dynamic(() => import('@/modules/openclaw/mcp'), { ssr: false }),
  'openclaw-plugins': dynamic(() => import('@/modules/openclaw/plugins'), { ssr: false }),
  'openclaw-integrations': dynamic(() => import('@/modules/openclaw/integrations'), { ssr: false }),
  'openclaw-terminal': dynamic(() => import('@/modules/openclaw/terminal'), { ssr: false }),
  'openclaw-agents': dynamic(() => import('@/modules/openclaw/agents'), { ssr: false }),
  'openclaw-models': dynamic(() => import('@/modules/openclaw/models'), { ssr: false }),
  'openclaw-automation': dynamic(() => import('@/modules/openclaw/automation'), { ssr: false }),
  'openclaw-graph': dynamic(() => import('@/modules/openclaw/graph/page'), { ssr: false }),
  'ekyc': dynamic(() => import('@/modules/ekyc/page'), { ssr: false }),
  'tapsecure': dynamic(() => import('@/modules/tapsecure/page'), { ssr: false }),
  'agihan-bulan': dynamic(() => import('@/modules/agihan-bulan/page'), { ssr: false }),
  'sedekah-jumaat': dynamic(() => import('@/modules/sedekah-jumaat/page'), { ssr: false }),
  'docs': dynamic(() => import('@/modules/docs/page'), { ssr: false }),
  'ops-conductor': dynamic(() => import('@/modules/ops-conductor/page'), { ssr: false }),
  'asnafpreneur': dynamic(() => import('@/modules/asnafpreneur/page'), { ssr: false }),
  'kelas-ai': dynamic(() => import('@/modules/kelas-ai/page'), { ssr: false }),
  'gudang-barangan': dynamic(() => import('@/modules/gudang-barangan/page'), { ssr: false }),
  'settings': dynamic(() => import('@/modules/settings/page'), { ssr: false }),
};

interface ViewRendererProps {
  view: ViewId;
}

export function ViewRenderer({ view }: ViewRendererProps) {
  const Component = moduleLoaders[view];

  if (!Component) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Modul tidak dijumpai: {view}</p>
      </div>
    );
  }

  return <Component />;
}
