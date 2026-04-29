'use client';

import React, { useCallback } from 'react';
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

// --- Initial Data ---
const initialNodes: Node[] = [
  { 
    id: 'root', 
    data: { label: 'PUSPA Core' }, 
    position: { x: 250, y: 0 }, 
    type: 'input',
    style: { background: '#10b981', color: 'white', fontWeight: 'bold', borderRadius: '8px' } 
  },
  { 
    id: 'member-1', 
    data: { label: 'Member: Ahmad' }, 
    position: { x: 100, y: 100 }, 
    style: { background: '#3b82f6', color: 'white', borderRadius: '8px' } 
  },
  { 
    id: 'case-1', 
    data: { label: 'Case: CS-001' }, 
    position: { x: 400, y: 100 }, 
    style: { background: '#f59e0b', color: 'white', borderRadius: '8px' } 
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'root', target: 'member-1', animated: true },
  { id: 'e1-3', source: 'root', target: 'case-1', animated: true },
];

export default function GraphCanvas() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

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
          nodeColor={(n) => (n.id === 'root' ? '#10b981' : '#3b82f6')}
        />
        
        <Panel position="top-right" className="flex gap-2">
          <Card className={cn(
            "px-3 py-2 text-xs font-medium shadow-lg backdrop-blur-md",
            isDark ? "bg-black/40 text-white border-white/10" : "bg-white/80 text-gray-900 border-black/10"
          )}>
            Intelligence Map v1.0
          </Card>
        </Panel>
      </ReactFlow>
    </div>
  );
}
