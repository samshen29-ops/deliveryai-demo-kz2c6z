import { describe, expect, it } from 'vitest'
import { STORAGE_KEY, createSeedState, type BoardState } from '../model'
import { loadBoard, resetBoard, saveBoard, type StorageLike } from '../storage'

class FakeStorage implements StorageLike {
  data = new Map<string, string>()
  failGet = false
  failSet = false
  getItem(key: string): string | null {
    if (this.failGet) throw new Error('get blocked')
    return this.data.has(key) ? this.data.get(key)! : null
  }
  setItem(key: string, value: string): void {
    if (this.failSet) throw new Error('quota exceeded')
    this.data.set(key, value)
  }
}

const seed = () => createSeedState()
const withVersion = (version: number): string => JSON.stringify({ version, items: [], updatedAt: '2026-11-27T00:00:00.000Z' })

describe('UT-STORAGE 持久化', () => {
  it('UT-STORAGE-01: 无 key 返回 empty + 12 条种子', () => {
    const result = loadBoard(new FakeStorage())
    expect(result.mode).toBe('empty')
    expect(result.state.items).toHaveLength(12)
    expect(result.raw).toBeNull()
  })

  it('UT-STORAGE-02: 合法保存后可往返加载', () => {
    const storage = new FakeStorage()
    const state = seed()
    state.items[0].title = '往返标题'
    expect(saveBoard(storage, state).ok).toBe(true)
    const result = loadBoard(storage)
    expect(result.mode).toBe('ok')
    expect(result.state.items[0].title).toBe('往返标题')
    expect(result.state.items[0].history).toEqual(state.items[0].history)
  })

  it('UT-STORAGE-03: 非 JSON 视为损坏，raw 保留，默认阻断保存，显式覆盖可恢复', () => {
    const storage = new FakeStorage()
    storage.data.set(STORAGE_KEY, 'not-json')
    const result = loadBoard(storage)
    expect(result.mode).toBe('corrupt')
    expect(result.raw).toBe('not-json')
    expect(result.state.items).toHaveLength(12)
    expect(saveBoard(storage, seed()).mode).toBe('blocked-corrupt')
    expect(storage.data.get(STORAGE_KEY)).toBe('not-json')
    expect(saveBoard(storage, seed(), { allowCorruptOverwrite: true }).ok).toBe(true)
    expect(loadBoard(storage).mode).toBe('ok')
  })

  it('UT-STORAGE-04: 版本不匹配视为损坏', () => {
    const storage = new FakeStorage()
    storage.data.set(STORAGE_KEY, withVersion(2))
    const result = loadBoard(storage)
    expect(result.mode).toBe('corrupt')
    expect(result.raw).toContain('"version":2')
  })

  it('UT-STORAGE-05/06/07: items 非数组、缺字段、枚举非法均视为损坏', () => {
    const cases: string[] = [
      JSON.stringify({ version: 1, items: {}, updatedAt: '2026-11-27T00:00:00.000Z' }),
      JSON.stringify({ version: 1, items: [{ ...seed().items[0], title: undefined }], updatedAt: '2026-11-27T00:00:00.000Z' }),
      JSON.stringify({ version: 1, items: [{ ...seed().items[0], status: '未知' }], updatedAt: '2026-11-27T00:00:00.000Z' }),
    ]
    for (const raw of cases) {
      const storage = new FakeStorage()
      storage.data.set(STORAGE_KEY, raw)
      const result = loadBoard(storage)
      expect(result.mode).toBe('corrupt')
      expect(result.raw).toBe(raw)
    }
  })

  it('UT-STORAGE-08: 重复 ID 视为损坏，不静默去重', () => {
    const storage = new FakeStorage()
    const state = seed()
    state.items[1].id = state.items[0].id
    storage.data.set(STORAGE_KEY, JSON.stringify(state))
    const result = loadBoard(storage)
    expect(result.mode).toBe('corrupt')
    expect(result.raw).toContain('"items"')
  })

  it('UT-STORAGE-09: 未知顶层/工作项字段在保存后保留', () => {
    const storage = new FakeStorage()
    const state = seed() as BoardState & { 'x-extra': string }
    state['x-extra'] = 'keep-top'
    ;(state.items[0] as Record<string, unknown>)['x-extra'] = 'keep-item'
    expect(saveBoard(storage, state).ok).toBe(true)
    const result = loadBoard(storage)
    expect(result.mode).toBe('ok')
    expect((result.state as Record<string, unknown>)['x-extra']).toBe('keep-top')
    expect((result.state.items[0] as Record<string, unknown>)['x-extra']).toBe('keep-item')
  })

  it('UT-STORAGE-10: 复位只改本应用 key，其他 key 原样保留', () => {
    const storage = new FakeStorage()
    storage.data.set('i18nextLng', 'zh')
    storage.data.set('elderly-mode', 'false')
    storage.data.set('unrelated-key', 'keep-me')
    storage.data.set(STORAGE_KEY, JSON.stringify({ ...seed(), items: [] }))
    const result = resetBoard(storage, seed())
    expect(result.ok).toBe(true)
    expect(storage.data.get('i18nextLng')).toBe('zh')
    expect(storage.data.get('elderly-mode')).toBe('false')
    expect(storage.data.get('unrelated-key')).toBe('keep-me')
    expect(loadBoard(storage).state.items).toHaveLength(12)
  })

  it('UT-STORAGE-11: getItem 抛错降级为 unavailable，不抛未处理错误', () => {
    const storage = new FakeStorage()
    storage.failGet = true
    const result = loadBoard(storage)
    expect(result.mode).toBe('unavailable')
    expect(result.state.items).toHaveLength(12)
    expect(result.reason).toContain('浏览器存储不可用')
  })

  it('UT-STORAGE-12: 写入抛错返回 write-error，恢复后重试成功', () => {
    const storage = new FakeStorage()
    storage.failSet = true
    const first = saveBoard(storage, seed())
    expect(first.ok).toBe(false)
    expect(first.mode).toBe('write-error')
    storage.failSet = false
    expect(saveBoard(storage, seed()).ok).toBe(true)
  })

  it('storage 为 null 时加载/保存均降级，不抛错', () => {
    expect(loadBoard(null).mode).toBe('unavailable')
    expect(saveBoard(null, seed()).mode).toBe('write-error')
  })
})
