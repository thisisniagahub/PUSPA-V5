'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  Edge, 
  Node,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import type { OpenClawSnapshot } from '@/lib/openclaw';

// ── Node colour mapping ─────────────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  core: '#10b981',
  agent: '#8b5cf6',
  channel: '#06b6d4',
  cron: '#f59e0b',
  plugin: '#ec4899',
  mcp: '#f97316',
  member: '#3b82f6',
  case: '#ef4444',
  programme: '#14b8a6',
  donor: '#6366f1',
  offline: '#6b7280',
};

function nodeStyle(color: string, isDark: boolean) {
  return {
    background: color,
    color: 'white',
    fontWeight: 600,
    borderRadius: '8px',
    fontSize: 12,
    padding: '6px 12px',
    border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
  };
}

// ── Build graph from OpenClaw snapshot ───────────────────────────────────────

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

function buildGraphFromSnapshot(snapshot: OpenClawSnapshot | null, dbStats: DbStats | null, isDark: boolean): GraphData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let y = 0;

  // Central PUSPA Core node
  const coreColor = snapshot?.gateway.connected ? NODE_COLORS.core : NODE_COLORS.offline;
  nodes.push({
    id: 'core',
    data: { label: snapshot?.gateway.connected ? 'PUSPA Core (LIVE)' : 'PUSPA Core (Offline)' },
    position: { x: 400, y: 0 },
    type: 'input',
    style: nodeStyle(coreColor, isDark),
  });

  y = 120;

  // Agent nodes from snapshot
  if (snapshot?.agents?.length) {
    const activeAgents = snapshot.agents.filter((a) => (a.sessionCount || 0) > 0);
    const agentGroupX = 100;

    nodes.push({
      id: 'agents-group',
      data: { label: `Agents (${activeAgents.length}/${snapshot.agents.length} active)` },
      position: { x: agentGroupX, y },
      style: nodeStyle(NODE_COLORS.agent, isDark),
    });
    edges.push({ id: 'e-core-agents', source: 'core', target: 'agents-group', animated: snapshot.gateway.connected });

    y += 80;
    snapshot.agents.slice(0, 8).forEach((agent, i) => {
      const isActive = (agent.sessionCount || 0) > 0;
      nodes.push({
        id: `agent-${i}`,
        data: { label: `${agent.id}${isActive ? ` (${agent.sessionCount}s)` : ''}` },
        position: { x: agentGroupX + (i % 2) * 220, y: y + Math.floor(i / 2) * 60 },
        style: nodeStyle(isActive ? NODE_COLORS.agent : NODE_COLORS.offline, isDark),
      });
      edges.push({ id: `e-agents-${i}`, source: 'agents-group', target: `agent-${i}` });
    });

    y += Math.ceil(Math.min(snapshot.agents.length, 8) / 2) * 60 + 80;
  }

  // Channel nodes from snapshot
  if (snapshot?.channels?.items?.length) {
    const connectedCount = snapshot.channels.items.filter((c) => c.connected).length;
    nodes.push({
      id: 'channels-group',
      data: { label: `Channels (${connectedCount}/${snapshot.channels.total})` },
      position: { x: 500, y: 120 },
      style: nodeStyle(NODE_COLORS.channel, isDark),
    });
    edges.push({ id: 'e-core-channels', source: 'core', target: 'channels-group', animated: true });
  }

  // Automation / cron nodes from snapshot
  if (snapshot?.automation?.cron?.length) {
    const enabledCount = snapshot.automation.cron.filter((c) => c.enabled).length;
    nodes.push({
      id: 'automation-group',
      data: { label: `Cron Jobs (${enabledCount}/${snapshot.automation.cron.length})` },
      position: { x: 700, y: 120 },
      style: nodeStyle(NODE_COLORS.cron, isDark),
    });
    edges.push({ id: 'e-core-automation', source: 'core', target: 'automation-group', animated: true });
  }

  // Plugin nodes from snapshot
  if (snapshot?.plugins?.entries?.length) {
    const enabledCount = snapshot.plugins.entries.filter((p) => p.enabled).length;
    nodes.push({
      id: 'plugins-group',
      data: { label: `Plugins (${enabledCount}/${snapshot.plugins.entries.length})` },
      position: { x: 900, y: 120 },
      style: nodeStyle(NODE_COLORS.plugin, isDark),
    });
    edges.push({ id: 'e-core-plugins', source: 'core', target: 'plugins-group' });
  }

  // MCP servers from snapshot
  if (snapshot?.mcp?.servers?.length) {
    const enabledCount = snapshot.mcp.servers.filter((s) => s.enabled).length;
    nodes.push({
      id: 'mcp-group',
      data: { label: `MCP Servers (${enabledCount}/${snapshot.mcp.servers.length})` },
      position: { x: 1100, y: 120 },
      style: nodeStyle(NODE_COLORS.mcp, isDark),
    });
    edges.push({ id: 'e-core-mcp', source: 'core', target: 'mcp-group' });
  }

  // Database entities (from local DB stats)
  if (dbStats) {
    const dbGroupY = Math.max(y, 300);
    nodes.push({
      id: 'db-group',
      data: { label: 'PUSPA Database' },
      position: { x: 300, y: dbGroupY },
      style: nodeStyle('#1e40af', isDark),
    });
    edges.push({ id: 'e-core-db', source: 'core', target: 'db-group', animated: true });

    const entityY = dbGroupY + 80;
    const entities = [
      { id: 'members', label: `Members (${dbStats.members})`, color: NODE_COLORS.member },
      { id: 'cases', label: `Cases (${dbStats.cases})`, color: NODE_COLORS.case },
      { id: 'programmes', label: `Programmes (${dbStats.programmes})`, color: NODE_COLORS.programme },
      { id: 'donors', label: `Donors (${dbStats.donors})`, color: NODE_COLORS.donor },
    ];

    entities.forEach((entity, i) => {
      nodes.push({
        id: `db-${entity.id}`,
        data: { label: entity.label },
        position: { x: 100 + i * 220, y: entityY },
        style: nodeStyle(entity.color, isDark),
      });
      edges.push({ id: `e-db-${entity.id}`, source: 'db-group', target: `db-${entity.id}` });
    });
  }

  return { nodes, edges };
}

// ── DB stats type ────────────────────────────────────────────────────────────

interface DbStats {
  members: number;
  cases: number;
  programmes: number;
  donors: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function GraphCanvas() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [snapshot, setSnapshot] = useState<OpenClawSnapshot | null>(null);
  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch OpenClaw snapshot
      let snapshotData: OpenClawSnapshot | null = null;
      try {
        snapshotData = await api.get<OpenClawSnapshot>('/openclaw/snapshot');
      } catch {
        // Gateway may be offline — continue with DB data only
      }
      setSnapshot(snapshotData);

      // Fetch DB entity counts for the graph
      let stats: DbStats | null = null;
      try {
        const res = await fetch('/api/v1/dashboard/stats');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            stats = {
              members: json.data.members ?? 0,
              cases: json.data.cases ?? 0,
              programmes: json.data.programmes ?? 0,
              donors: json.data.donors ?? 0,
            };
          }
        }
      } catch {
        // DB stats unavailable
      }
      setDbStats(stats);

      // Build graph from data
      const graph = buildGraphFromSnapshot(snapshotData, stats, isDark);
      setNodes(graph.nodes);
      setEdges(graph.edges);
    } finally {
      setLoading(false);
    }
  }, [isDark, setNodes, setEdges]);

  useEffect(() => {
    loadData();
  }, []);

  // Rebuild graph when theme changes
  useEffect(() => {
    if (snapshot || dbStats) {
      const graph = buildGraphFromSnapshot(snapshot, dbStats, isDark);
      setNodes(graph.nodes);
      setEdges(graph.edges);
    }
  }, [isDark]);

  return (
    <div className="h-full w-full relative bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="h-full w-full"
      >
        <Background color={isDark ? '#333' : '#ccc'} gap={20} />
        <Controls />
        <MiniMap 
          style={{ background: isDark ? '#1a1a1a' : '#f5f5f5' }} 
          nodeColor={(n) => {
            const style = n.style as Record<string, string> | undefined;
            return style?.background || (isDark ? '#555' : '#ccc');
          }}
        />
        
        <Panel position="top-right" className="flex gap-2">
          <Card className={cn(
            "px-3 py-2 text-xs font-medium shadow-lg backdrop-blur-md",
            isDark ? "bg-black/40 text-white border-white/10" : "bg-white/80 text-gray-900 border-black/10"
          )}>
            <div className="flex items-center gap-2">
              <span>Intelligence Map</span>
              <span className={cn(
                "inline-block h-2 w-2 rounded-full",
                snapshot?.gateway.connected ? "bg-green-400" : loading ? "bg-yellow-400 animate-pulse" : "bg-red-400"
              )} />
              <span className="text-muted-foreground">
                {snapshot?.gateway.connected ? 'LIVE' : loading ? 'LOADING' : 'OFFLINE'}
              </span>
            </div>
          </Card>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className={cn(
              "h-8 px-2 shadow-lg backdrop-blur-md",
              isDark ? "bg-black/40 border-white/10" : "bg-white/80 border-black/10"
            )}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
