import { STORAGE_KEY, type BoardState } from './model'
import { createSeedState } from './model'
import { validateBoardState } from './rules'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type LoadMode = 'ok' | 'empty' | 'corrupt' | 'unavailable'

export interface LoadResult {
  mode: LoadMode
  state: BoardState
  raw: string | null
  reason: string
}

export type SaveMode = 'ok' | 'write-error' | 'blocked-corrupt'

export interface SaveResult {
  ok: boolean
  mode: SaveMode
  reason: string
}

const UNAVAILABLE = '浏览器存储不可用：无法访问 localStorage。改动仅在本次页面保留。'

export function loadBoard(storage: StorageLike | null): LoadResult {
  if (!storage) {
    return { mode: 'unavailable', state: createSeedState(), raw: null, reason: UNAVAILABLE }
  }

  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch (error) {
    const detail = error instanceof Error ? error.message : '无法访问 localStorage'
    return {
      mode: 'unavailable',
      state: createSeedState(),
      raw: null,
      reason: `浏览器存储不可用：${detail}。改动仅在本次页面保留。`,
    }
  }

  if (raw === null) {
    return { mode: 'empty', state: createSeedState(), raw: null, reason: '' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      mode: 'corrupt',
      state: createSeedState(),
      raw,
      reason: '本地数据不是合法 JSON，原始内容已保留。',
    }
  }

  const validation = validateBoardState(parsed)
  if (!validation.ok) {
    return {
      mode: 'corrupt',
      state: createSeedState(),
      raw,
      reason: `本地数据结构不符合当前版本：${validation.reason}。原始内容已保留。`,
    }
  }

  return { mode: 'ok', state: validation.state, raw, reason: '' }
}

export interface SaveOptions {
  allowCorruptOverwrite?: boolean
}

export function saveBoard(storage: StorageLike | null, state: BoardState, options: SaveOptions = {}): SaveResult {
  if (!storage) {
    return { ok: false, mode: 'write-error', reason: UNAVAILABLE }
  }

  try {
    if (!options.allowCorruptOverwrite) {
      const existing = storage.getItem(STORAGE_KEY)
      if (existing !== null) {
        let parsed: unknown
        try {
          parsed = JSON.parse(existing)
        } catch {
          return {
            ok: false,
            mode: 'blocked-corrupt',
            reason: '检测到本地数据损坏；在你确认覆盖前，不会改写原始内容。',
          }
        }
        if (!validateBoardState(parsed).ok) {
          return {
            ok: false,
            mode: 'blocked-corrupt',
            reason: '检测到本地数据结构不兼容；在你确认覆盖前，不会改写原始内容。',
          }
        }
      }
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return { ok: true, mode: 'ok', reason: '' }
  } catch (error) {
    const detail = error instanceof Error ? error.message : '未知错误'
    return {
      ok: false,
      mode: 'write-error',
      reason: `写入 localStorage 失败：${detail}。改动仅在本次页面保留。`,
    }
  }
}

export function resetBoard(storage: StorageLike | null, seed: BoardState): SaveResult {
  return saveBoard(storage, seed, { allowCorruptOverwrite: true })
}

export function exportRaw(raw: string): void {
  if (typeof document === 'undefined') return
  const blob = new Blob([raw], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'sdlc-demo-board-corrupt.json'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function getStorageSafe(): StorageLike | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

export function retrySaveBoard(storage: StorageLike | null, state: BoardState): SaveResult {
  return saveBoard(storage, state)
}
