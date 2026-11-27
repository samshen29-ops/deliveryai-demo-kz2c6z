import { useEffect, useMemo, useRef, useState } from 'react'
import {
  nowIso,
  nextItemId,
  uid,
  type BoardState,
  type Status,
  type WorkItem,
  type WorkItemType,
  type Priority,
} from './model'
import {
  normalizeDraft,
  transitionItem,
  validateDraft,
  type FieldErrors,
  type WorkItemDraft,
} from './rules'
import {
  EMPTY_FILTERS,
  computeStats,
  filterItems,
  hasActiveFilters,
  type BoardFilters,
} from './query'
import {
  exportRaw as downloadRaw,
  getStorageSafe,
  loadBoard,
  resetBoard,
  retrySaveBoard,
  saveBoard,
  type LoadMode,
  type StorageLike,
} from './storage'
import { createSeedState } from './model'

export type BoardSubView = 'board' | 'evidence' | 'guide'
export interface ToastMessage { message: string; kind: 'success' | 'error' }

function createItem(draft: WorkItemDraft, id: string): WorkItem {
  const now = nowIso()
  return {
    id,
    type: draft.type as WorkItemType,
    title: draft.title,
    description: draft.description,
    priority: draft.priority as Priority,
    assignee: draft.assignee,
    acceptance: draft.acceptance,
    status: '待规划',
    createdAt: now,
    updatedAt: now,
    history: [{ id: uid('h'), at: now, from: null, to: '待规划', result: 'success', reason: '创建为待规划', actor: '示例用户' }],
    evidence: [{
      id: uid('e'),
      title: '示例记录 · 本页创建',
      kind: 'sample',
      type: 'note',
      status: '示例',
      detail: '这是在本页创建的演示工作项，不是真实业务记录。',
    }],
  }
}

export function useBoard() {
  const [storage] = useState<StorageLike | null>(() => getStorageSafe())
  const [loaded] = useState(() => loadBoard(storage))

  const [board, setBoard] = useState<BoardState>(loaded.state)
  const [mode, setMode] = useState<LoadMode | 'write-error'>(loaded.mode)
  const [raw, setRaw] = useState<string | null>(loaded.raw)
  const [storageMessage, setStorageMessage] = useState(loaded.reason)
  const [dirty, setDirty] = useState(false)

  const [filters, setFilters] = useState<BoardFilters>(EMPTY_FILTERS)
  const [view, setView] = useState<BoardSubView>('board')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetStep, setResetStep] = useState<1 | 2>(1)
  const [transitionNotice, setTransitionNotice] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const showToast = (message: string, kind: 'success' | 'error' = 'success') => {
    setToast({ message, kind })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4200)
  }

  const commit = (
    next: BoardState,
    options: { allowCorruptOverwrite?: boolean; reset?: boolean } = {},
  ): boolean => {
    setBoard(next)
    if (mode === 'corrupt' && !options.allowCorruptOverwrite) {
      setDirty(true)
      return false
    }
    if (!storage) {
      setMode('unavailable')
      setStorageMessage('浏览器存储不可用：无法访问 localStorage。改动仅在本次页面保留。')
      setDirty(true)
      return false
    }
    const result = options.reset
      ? resetBoard(storage, next)
      : saveBoard(storage, next, { allowCorruptOverwrite: options.allowCorruptOverwrite })
    if (result.ok) {
      setMode('ok')
      setRaw(null)
      setStorageMessage('')
      setDirty(false)
      return true
    }
    setMode(result.mode === 'blocked-corrupt' ? 'corrupt' : 'write-error')
    setStorageMessage(result.reason)
    setDirty(true)
    return false
  }

  const filteredItems = useMemo(() => filterItems(board.items, filters), [board.items, filters])
  const stats = useMemo(() => computeStats(filteredItems), [filteredItems])
  const filtersActive = hasActiveFilters(filters)
  const selectedItem = selectedId ? board.items.find((item) => item.id === selectedId) ?? null : null
  const editingItem = editingId ? board.items.find((item) => item.id === editingId) ?? null : null

  const updateFilters = (patch: Partial<BoardFilters>) => {
    setFilters((previous) => ({ ...previous, ...patch }))
  }

  const clearFilters = () => setFilters({ ...EMPTY_FILTERS })

  const openCreate = () => {
    setSelectedId(null)
    setEditingId(null)
    setCreateOpen(true)
  }

  const openEdit = (id: string) => {
    const item = board.items.find((candidate) => candidate.id === id)
    if (!item) return
    if (item.status === '已完成') {
      showToast('已完成工作项只读，不能编辑。', 'error')
      return
    }
    setSelectedId(null)
    setCreateOpen(false)
    setEditingId(id)
  }

  const closeForm = () => {
    setCreateOpen(false)
    setEditingId(null)
  }

  const saveDraft = (draft: WorkItemDraft, id?: string): FieldErrors => {
    const normalized = normalizeDraft(draft)
    const errors = validateDraft(normalized)
    if (Object.keys(errors).length > 0) return errors

    const now = nowIso()
    let next: BoardState
    let savedId: string

    if (id) {
      const existing = board.items.find((item) => item.id === id)
      if (!existing) return { title: '工作项已不存在，无法保存。' }
      if (existing.status === '已完成') return { title: '已完成工作项只读，不能保存修改。' }
      next = {
        ...board,
        updatedAt: now,
        items: board.items.map((item) => item.id === id
          ? {
              ...item,
              type: normalized.type as WorkItemType,
              title: normalized.title,
              description: normalized.description,
              priority: normalized.priority as Priority,
              assignee: normalized.assignee,
              acceptance: normalized.acceptance,
              updatedAt: now,
            }
          : item),
      }
      savedId = id
    } else {
      savedId = nextItemId(board.items)
      next = { ...board, updatedAt: now, items: [createItem(normalized, savedId), ...board.items] }
    }

    const persisted = commit(next)
    setCreateOpen(false)
    setEditingId(null)
    setSelectedId(savedId)
    showToast(
      persisted ? (id ? '已保存修改。' : '已新增待规划工作项。') : '已更新当前页面；本地持久化不可用。',
      persisted ? 'success' : 'error',
    )
    return {}
  }

  const openDetail = (id: string) => {
    setTransitionNotice(null)
    setSelectedId(id)
  }

  const closeDetail = () => {
    const previousId = selectedId
    setSelectedId(null)
    setTransitionNotice(null)
    if (previousId) {
      setTimeout(() => {
        document.querySelector<HTMLButtonElement>(`[data-testid="item-card"][data-id="${previousId}"]`)?.focus()
      }, 0)
    }
  }

  const transition = (id: string, target: Status) => {
    const item = board.items.find((candidate) => candidate.id === id)
    if (!item) {
      showToast('工作项不存在，无法流转。', 'error')
      return
    }
    const now = nowIso()
    const result = transitionItem(item, target, now, '示例用户')
    const next: BoardState = {
      ...board,
      updatedAt: now,
      items: board.items.map((candidate) => (candidate.id === id ? result.item : candidate)),
    }
    commit(next)
    setTransitionNotice(result.ok ? null : result.reason)
    showToast(
      result.ok ? `已流转到「${target}」。` : `流转被拒绝：${result.reason}`,
      result.ok ? 'success' : 'error',
    )
  }

  const openReset = () => {
    setResetStep(1)
    setResetOpen(true)
  }

  const continueReset = () => setResetStep(2)

  const cancelReset = () => {
    setResetOpen(false)
    setResetStep(1)
  }

  const confirmReset = () => {
    const next: BoardState = { ...createSeedState(), updatedAt: nowIso() }
    setFilters({ ...EMPTY_FILTERS })
    setSelectedId(null)
    setTransitionNotice(null)
    setCreateOpen(false)
    setEditingId(null)
    setResetOpen(false)
    setResetStep(1)
    const persisted = commit(next, { allowCorruptOverwrite: true, reset: true })
    showToast(
      persisted
        ? '已恢复 12 条演示数据；其他 localStorage key 未改动。'
        : '已恢复 12 条演示数据；本地存储不可用，刷新后可能丢失。',
      persisted ? 'success' : 'error',
    )
  }

  const overwriteCorrupt = () => {
    if (!storage) {
      setMode('unavailable')
      showToast('浏览器存储不可用，无法覆盖。', 'error')
      return
    }
    const result = saveBoard(storage, board, { allowCorruptOverwrite: true })
    if (result.ok) {
      setMode('ok')
      setRaw(null)
      setStorageMessage('')
      setDirty(false)
      showToast('已用当前数据覆盖本应用 key。', 'success')
    } else {
      setMode('write-error')
      setStorageMessage(result.reason)
      setDirty(true)
      showToast('覆盖失败，原始内容未被删除。', 'error')
    }
  }

  const retrySave = () => {
    const result = retrySaveBoard(storage, board)
    if (result.ok) {
      setMode('ok')
      setRaw(null)
      setStorageMessage('')
      setDirty(false)
      showToast('已重新写入本应用数据。', 'success')
    } else {
      setMode(result.mode === 'blocked-corrupt' ? 'corrupt' : 'write-error')
      setStorageMessage(result.reason)
      setDirty(true)
      showToast('重试保存失败，改动仍仅在本次页面保留。', 'error')
    }
  }

  const exportCorruptRaw = () => {
    if (raw !== null) downloadRaw(raw)
  }

  return {
    storage,
    board,
    mode,
    raw,
    dirty,
    storageMessage,
    filters,
    filteredItems,
    stats,
    filtersActive,
    view,
    setView,
    selectedId,
    selectedItem,
    createOpen,
    editingItem,
    formOpen: createOpen || editingId !== null,
    resetOpen,
    resetStep,
    transitionNotice,
    toast,
    showToast,
    updateFilters,
    clearFilters,
    openCreate,
    openEdit,
    closeForm,
    saveDraft,
    openDetail,
    closeDetail,
    transition,
    openReset,
    continueReset,
    cancelReset,
    confirmReset,
    overwriteCorrupt,
    retrySave,
    exportCorruptRaw,
    setSelectedId,
  }
}

export type BoardApi = ReturnType<typeof useBoard>
