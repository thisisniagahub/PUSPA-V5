import type { ComponentType, SVGProps } from 'react'
import type { ViewId } from '@/types'
import type { UserRole } from '@/stores/app-store'

export type SidebarIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>

export type SidebarNavItem = {
  id: ViewId
  label: string
  icon: SidebarIcon
  roles: UserRole[]
}

export type SidebarNavGroup = {
  title: string
  items: SidebarNavItem[]
  roles: UserRole[]
  subGroup?: string
}
