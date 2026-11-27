import { STATUSES, type Priority, type Status, type WorkItem, type WorkItemType } from './model'

export interface BoardFilters {
  q: string
  type: 'all' | WorkItemType
  priority: 'all' | Priority
  status: 'all' | Status
}

export const EMPTY_FILTERS: BoardFilters = { q: '', type: 'all', priority: 'all', status: 'all' }

export function filterItems(items: WorkItem[], filters: BoardFilters): WorkItem[] {
  const q = filters.q.trim().toLocaleLowerCase('zh-CN')
  return items.filter((item) => {
    const text = `${item.title}\n${item.description}`.toLocaleLowerCase('zh-CN')
    const matchesQuery = !q || text.includes(q)
    const matchesType = filters.type === 'all' || item.type === filters.type
    const matchesPriority = filters.priority === 'all' || item.priority === filters.priority
    const matchesStatus = filters.status === 'all' || item.status === filters.status
    return matchesQuery && matchesType && matchesPriority && matchesStatus
  })
}

export function hasActiveFilters(filters: BoardFilters): boolean {
  return Boolean(
    filters.q.trim() ||
      filters.type !== 'all' ||
      filters.priority !== 'all' ||
      filters.status !== 'all',
  )
}

const TYPE_LABELS: Record<string, string> = { requirement: '需求', defect: '缺陷' }

export function describeFilters(filters: BoardFilters): string {
  const parts: string[] = []
  if (filters.q.trim()) parts.push(`关键词「${filters.q.trim()}」`)
  if (filters.type !== 'all') parts.push(`类型：${TYPE_LABELS[filters.type]}`)
  if (filters.priority !== 'all') parts.push(`优先级：${filters.priority}`)
  if (filters.status !== 'all') parts.push(`状态：${filters.status}`)
  return parts.length ? parts.join(' · ') : '未设置筛选'
}

export interface BoardStats {
  total: number
  counts: Record<Status, number>
  completed: number
  rate: number | null
}

export function computeStats(items: WorkItem[]): BoardStats {
  const counts = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<Status, number>
  for (const item of items) counts[item.status] += 1
  const total = items.length
  const completed = counts['已完成']
  return {
    total,
    counts,
    completed,
    rate: total === 0 ? null : Math.round((completed / total) * 100),
  }
}

export function statusPercent(count: number, total: number): number | null {
  return total === 0 ? null : Math.round((count / total) * 100)
}
