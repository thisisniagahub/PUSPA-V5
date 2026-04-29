import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export type ConductorTab = 'chat' | 'tasks' | 'dashboard' | 'automations' | 'trace' | 'projects' | 'agents'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  workItemId?: string
  isStreaming?: boolean
}

export interface TraceEntry {
  id: string
  workItemId: string
  type: string
  summary: string
  detail?: string
  toolName?: string
  status: string
  latencyMs?: number
  createdAt: string
}

export interface OpsWorkItem {
  id: string
  workItemNumber: string
  title: string
  project: string
  domain: string
  sourceChannel: string
  requestText: string
  intent: string
  status: string
  priority: string
  currentStep?: string
  nextAction?: string
  blockerReason?: string
  resolutionSummary?: string
  tags?: string
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
  executionEvents?: TraceEntry[]
  artifacts?: OpsArtifact[]
  automationJobs?: OpsAutomation[]
}

export interface OpsAutomation {
  id: string
  title: string
  description?: string
  kind: string
  expr?: string
  domain: string
  relatedProject: string
  workItemId?: string
  isEnabled: boolean
  lastRunAt?: string
  nextRunAt?: string
  lastResult?: string
  failureState?: string
}

export interface OpsArtifact {
  id: string
  workItemId?: string
  type: string
  title: string
  summary?: string
  pathOrRef?: string
  metadata?: string
  createdAt: string
}

export interface OpsDashboardSummary {
  workItemsByStatus: Record<string, number>
  automationCounts: { active: number; total: number }
  recentEvents: TraceEntry[]
  domainSummary: Record<string, number>
  upcomingAutomations: OpsAutomation[]
}

export interface OpsProject {
  name: string
  workItemCount: number
  completedCount: number
  blockedCount: number
  lastActivity: string
}

export interface OpsStats {
  totalWorkItems: number
  completedToday: number
  completedThisWeek: number
  completedThisMonth: number
  avgResolutionTime: number
  topDomains: Array<{ domain: string; count: number }>
  topIntents: Array<{ intent: string; count: number }>
  failureRate: number
  activeAutomations: number
  recentActivity: TraceEntry[]
}

export interface ApprovalRequest {
  id: string
  workItemId: string
  action: string
  reason: string
  riskLevel: 'low' | 'medium' | 'high'
  status: 'pending' | 'approved' | 'rejected' | 'revised'
  createdAt: string
}

export interface OpsState {
  // UI State
  activeTab: ConductorTab
  setActiveTab: (tab: ConductorTab) => void

  // Chat
  messages: ChatMessage[]
  isProcessing: boolean
  currentWorkItemId: string | null

  // Tasks
  workItems: OpsWorkItem[]
  selectedWorkItem: OpsWorkItem | null
  workItemFilter: { status?: string; domain?: string }
  selectedWorkItemIds: string[]
  setSelectedWorkItemIds: (ids: string[]) => void
  toggleWorkItemSelection: (id: string) => void
  clearSelection: () => void

  // Trace
  traceEntries: TraceEntry[]

  // Automations
  automations: OpsAutomation[]

  // Dashboard
  dashboardSummary: OpsDashboardSummary | null
  opsStats: OpsStats | null

  // Artifacts
  artifacts: OpsArtifact[]

  // Projects
  projects: OpsProject[]

  // Approvals
  pendingApprovals: ApprovalRequest[]

  // Actions
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  updateLastMessage: (content: string) => void
  setProcessing: (v: boolean) => void
  setCurrentWorkItemId: (id: string | null) => void
  setWorkItems: (items: OpsWorkItem[]) => void
  setSelectedWorkItem: (item: OpsWorkItem | null) => void
  setWorkItemFilter: (filter: { status?: string; domain?: string }) => void
  setTraceEntries: (entries: TraceEntry[]) => void
  addTraceEntry: (entry: Omit<TraceEntry, 'id' | 'createdAt'>) => void
  setAutomations: (items: OpsAutomation[]) => void
  setDashboardSummary: (summary: OpsDashboardSummary | null) => void
  setOpsStats: (stats: OpsStats | null) => void
  setArtifacts: (items: OpsArtifact[]) => void
  setProjects: (items: OpsProject[]) => void
  addPendingApproval: (approval: ApprovalRequest) => void
  removeApproval: (id: string) => void
  clearChat: () => void
}

export const useOpsStore = create<OpsState>()(
  persist(
    (set, get) => ({
      activeTab: 'chat',
      setActiveTab: (tab) => set({ activeTab: tab }),

      messages: [],
      isProcessing: false,
      currentWorkItemId: null,

      workItems: [],
      selectedWorkItem: null,
      workItemFilter: {},
      selectedWorkItemIds: [],
      setSelectedWorkItemIds: (ids) => set({ selectedWorkItemIds: ids }),
      toggleWorkItemSelection: (id) => set((s) => ({
        selectedWorkItemIds: s.selectedWorkItemIds.includes(id)
          ? s.selectedWorkItemIds.filter((i) => i !== id)
          : [...s.selectedWorkItemIds, id],
      })),
      clearSelection: () => set({ selectedWorkItemIds: [] }),

      traceEntries: [],

      automations: [],

      dashboardSummary: null,
      opsStats: null,

      artifacts: [],
      projects: [],
      pendingApprovals: [],

      addMessage: (msg) => set((s) => ({
        messages: [...s.messages, {
          ...msg,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        }],
      })),

      updateLastMessage: (content) => set((s) => {
        const msgs = [...s.messages]
        if (msgs.length > 0) {
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
        }
        return { messages: msgs }
      }),

      setProcessing: (v) => set({ isProcessing: v }),
      setCurrentWorkItemId: (id) => set({ currentWorkItemId: id }),
      setWorkItems: (items) => set({ workItems: items }),
      setSelectedWorkItem: (item) => set({ selectedWorkItem: item }),
      setWorkItemFilter: (filter) => set({ workItemFilter: filter }),
      setTraceEntries: (entries) => set({ traceEntries: entries }),
      addTraceEntry: (entry) => set((s) => ({
        traceEntries: [...s.traceEntries, {
          ...entry,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }],
      })),
      setAutomations: (items) => set({ automations: items }),
      setDashboardSummary: (summary) => set({ dashboardSummary: summary }),
      setOpsStats: (stats) => set({ opsStats: stats }),
      setArtifacts: (items) => set({ artifacts: items }),
      setProjects: (items) => set({ projects: items }),
      addPendingApproval: (approval) => set((s) => ({ pendingApprovals: [...s.pendingApprovals, approval] })),
      removeApproval: (id) => set((s) => ({ pendingApprovals: s.pendingApprovals.filter((a) => a.id !== id) })),
      clearChat: () => set({ messages: [], currentWorkItemId: null }),
    }),
    {
      name: 'puspa-ops-state',
      partialize: (state) => ({
        activeTab: state.activeTab,
        messages: state.messages,
      }),
    },
  ),
)
