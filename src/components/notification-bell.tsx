'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

type NotificationItem = {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  isRead: boolean
  link?: string | null
  createdAt: string
}

type NotificationResponse = {
  success: boolean
  data: NotificationItem[]
  unreadCount: number
}

const TYPE_STYLES: Record<NotificationItem['type'], string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const latestItems = useMemo(() => items.slice(0, 8), [items])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/notifications?pageSize=8', {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) throw new Error('Failed to fetch notifications')

      const json = (await response.json()) as NotificationResponse
      setItems(json.data || [])
      setUnreadCount(json.unreadCount || 0)
    } catch {
      setItems([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/v1/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, isRead: true }),
      })

      if (!response.ok) throw new Error('Failed to update notification')

      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      await loadNotifications()
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/v1/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAllRead: true }),
      })

      if (!response.ok) throw new Error('Failed to update notifications')

      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })))
      setUnreadCount(0)
    } catch {
      await loadNotifications()
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && loadNotifications()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 shrink-0" aria-label="Lihat notifikasi">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px]">
        <DropdownMenuLabel className="flex items-center justify-between gap-3">
          <span>Notifikasi</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={(event) => {
              event.preventDefault()
              void markAllAsRead()
            }}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Tandakan semua
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading && (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Memuatkan notifikasi...
          </div>
        )}
        {!loading && latestItems.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Tiada notifikasi baru.
          </div>
        )}
        {!loading &&
          latestItems.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="block cursor-pointer p-0"
              onSelect={(event) => {
                event.preventDefault()
                if (!item.isRead) void markAsRead(item.id)
              }}
            >
              <div className="space-y-2 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="mt-1 whitespace-normal text-xs leading-5 text-muted-foreground">
                      {item.message}
                    </p>
                  </div>
                  {!item.isRead && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500" />}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline" className={`text-[10px] ${TYPE_STYLES[item.type]}`}>
                    {item.type}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString('ms-MY')}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
