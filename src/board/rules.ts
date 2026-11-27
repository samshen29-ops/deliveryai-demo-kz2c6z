import {
  ASSIGNEES,
  PRIORITIES,
  STATUSES,
  TITLE_MAX,
  TEXT_MAX,
  isAssignee,
  isPriority,
  isStatus,
  isType,
  uid,
  type BoardState,
  type Evidence,
  type HistoryEvent,
  type Status,
  type WorkItem,
} from './model'

export interface WorkItemDraft {
  type: string
  title: string
  description: string
  priority: string
  assignee: string
  acceptance: string
}

export type FieldErrors = Partial<Record<keyof WorkItemDraft, string>>

export function countChars(value: string): number {
  return Array.from(String(value || '')).length
}

export function normalizeDraft(draft: WorkItemDraft): WorkItemDraft {
  return { ...draft, title: draft.title.trim() }
}

export function validateDraft(draft: WorkItemDraft): FieldErrors {
  const errors: FieldErrors = {}
  const title = normalizeDraft(draft).title
  const titleLength = countChars(title)
  const descriptionLength = countChars(draft.description)
  const acceptanceLength = countChars(draft.acceptance)

  if (titleLength === 0) errors.title = '标题不能为空。'
  else if (titleLength > TITLE_MAX) errors.title = `标题最多 ${TITLE_MAX} 个字符，当前 ${titleLength} 个。`

  if (descriptionLength > TEXT_MAX) errors.description = `描述最多 ${TEXT_MAX} 个字符，当前 ${descriptionLength} 个。`
  if (acceptanceLength > TEXT_MAX) errors.acceptance = `验收说明最多 ${TEXT_MAX} 个字符，当前 ${acceptanceLength} 个。`

  if (!isType(draft.type)) errors.type = '请选择需求或缺陷。'
  if (!isPriority(draft.priority)) errors.priority = '请选择合法优先级。'
  if (!isAssignee(draft.assignee)) errors.assignee = '请选择示例负责人。'

  return errors
}

const hasOwnString = (value: object, key: string): boolean =>
  typeof (value as Record<string, unknown>)[key] === 'string'

function validateHistory(value: unknown): string | null {
  if (!Array.isArray(value)) return '历史不是数组'
  for (const event of value) {
    if (!event || typeof event !== 'object' || Array.isArray(event)) return '历史事件非法'
    const item = event as Record<string, unknown>
    if (typeof item.id !== 'string') return '历史事件缺少 id'
    if (typeof item.at !== 'string') return '历史事件缺少时间'
    if (item.from !== null && !isStatus(item.from)) return '历史来源状态非法'
    if (!isStatus(item.to)) return '历史目标状态非法'
    if (item.result !== 'success' && item.result !== 'rejected') return '历史结果非法'
    if (typeof item.reason !== 'string' || item.reason.length === 0) return '历史原因非法'
    if (typeof item.actor !== 'string') return '历史操作人非法'
  }
  return null
}

function validateEvidence(value: unknown): string | null {
  if (!Array.isArray(value)) return '证据不是数组'
  for (const evidence of value) {
    if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return '证据非法'
    const item = evidence as Record<string, unknown>
    if (typeof item.id !== 'string') return '证据缺少 id'
    if (typeof item.title !== 'string') return '证据标题非法'
    if (item.kind !== 'sample' && item.kind !== 'real' && item.kind !== 'pending') return '证据类型非法'
    if (!['note', 'doc', 'test', 'pr', 'screenshot'].includes(String(item.type))) return '证据展示类型非法'
    if (typeof item.status !== 'string') return '证据状态非法'
    if (typeof item.detail !== 'string') return '证据说明非法'
  }
  return null
}

export function validateBoardState(value: unknown): { ok: true; state: BoardState } | { ok: false; reason: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, reason: '顶层不是对象' }
  const state = value as Record<string, unknown>
  if (state.version !== 1) return { ok: false, reason: `版本不匹配：${String(state.version)}` }
  if (!Array.isArray(state.items)) return { ok: false, reason: 'items 不是数组' }
  if (typeof state.updatedAt !== 'string') return { ok: false, reason: '缺少 updatedAt' }

  const seen = new Set<string>()
  for (let index = 0; index < state.items.length; index += 1) {
    const item = state.items[index]
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { ok: false, reason: `第 ${index + 1} 条工作项不是对象` }
    const record = item as Record<string, unknown>
    for (const field of ['id', 'type', 'title', 'description', 'priority', 'assignee', 'acceptance', 'status', 'createdAt', 'updatedAt']) {
      if (!hasOwnString(record, field)) return { ok: false, reason: `第 ${index + 1} 条缺少字段 ${field}` }
    }
    if (!isType(record.type)) return { ok: false, reason: `第 ${index + 1} 条类型非法` }
    if (!isPriority(record.priority)) return { ok: false, reason: `第 ${index + 1} 条优先级非法` }
    if (!isStatus(record.status)) return { ok: false, reason: `第 ${index + 1} 条状态非法` }
    if (!isAssignee(record.assignee)) return { ok: false, reason: `第 ${index + 1} 条负责人非法` }
    const id = record.id as string
    if (seen.has(id)) return { ok: false, reason: `工作项 ID 重复：${id}` }
    seen.add(id)
    const historyError = validateHistory(record.history)
    if (historyError) return { ok: false, reason: `第 ${index + 1} 条${historyError}` }
    const evidenceError = validateEvidence(record.evidence)
    if (evidenceError) return { ok: false, reason: `第 ${index + 1} 条${evidenceError}` }
  }

  return { ok: true, state: value as BoardState }
}

export const TRANSITIONS: Record<Status, Status[]> = {
  待规划: ['进行中'],
  进行中: ['审核中', '阻塞中'],
  阻塞中: ['进行中'],
  审核中: ['已完成', '进行中'],
  已完成: [],
}

export function canTransition(from: Status, to: Status): boolean {
  return TRANSITIONS[from].includes(to)
}

export interface TransitionResult {
  ok: boolean
  item: WorkItem
  reason: string
  event: HistoryEvent
}

export function transitionItem(item: WorkItem, target: Status, now: string, actor = '示例用户'): TransitionResult {
  const allowed = TRANSITIONS[item.status] ?? []
  let ok = false
  let reason: string

  if (!isStatus(target)) {
    reason = '目标状态不合法。'
  } else if (item.status === '已完成') {
    reason = '已完成工作项只读，不允许任何状态流转，也不会自动重开。'
  } else if (!allowed.includes(target)) {
    reason = `不允许从「${item.status}」直接流转到「${target}」。允许的目标状态：${allowed.length ? allowed.join('、') : '无'}。`
  } else {
    ok = true
    reason = `状态从「${item.status}」流转到「${target}」。`
  }

  const event: HistoryEvent = {
    id: uid('h'),
    at: now,
    from: item.status,
    to: target,
    result: ok ? 'success' : 'rejected',
    reason,
    actor,
  }

  return {
    ok,
    reason,
    event,
    item: {
      ...item,
      status: ok ? target : item.status,
      updatedAt: now,
      history: [event, ...item.history],
    },
  }
}

export function allowedTargets(status: Status): Status[] {
  return [...TRANSITIONS[status]]
}

export function allOtherStatuses(status: Status): Status[] {
  return STATUSES.filter((candidate) => candidate !== status)
}

export const ENUM_VALUES = { PRIORITIES, ASSIGNEES, STATUSES }

export type { Evidence }
