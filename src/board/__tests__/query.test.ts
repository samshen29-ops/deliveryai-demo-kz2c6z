import { describe, expect, it } from 'vitest'
import { createSeedState, type Priority, type Status, type WorkItem, type WorkItemType } from '../model'
import { EMPTY_FILTERS, computeStats, describeFilters, filterItems, hasActiveFilters, statusPercent, type BoardFilters } from '../query'

const seeds = createSeedState().items
const filters = (patch: Partial<BoardFilters> = {}): BoardFilters => ({ ...EMPTY_FILTERS, ...patch })

const makeItem = (id: string, patch: Partial<WorkItem> = {}): WorkItem => ({
  id,
  type: 'requirement' as WorkItemType,
  title: '示例标题',
  description: '',
  priority: 'P2' as Priority,
  assignee: '示例产品',
  acceptance: '',
  status: '待规划' as Status,
  createdAt: '2026-11-27T00:00:00.000Z',
  updatedAt: '2026-11-27T00:00:00.000Z',
  history: [],
  evidence: [],
  ...patch,
})

describe('UT-FILTER 筛选', () => {
  it('UT-FILTER-01: 无筛选返回全部 12 条', () => {
    expect(filterItems(seeds, EMPTY_FILTERS)).toHaveLength(12)
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
  })

  it('UT-FILTER-02/05: 标题与中文子串命中', () => {
    const result = filterItems(seeds, filters({ q: '筛选' }))
    expect(result.map((item) => item.id).sort()).toEqual(['DEMO-101', 'DEMO-102', 'DEMO-105', 'DEMO-107'])
    expect(filterItems(seeds, filters({ q: '状态' })).some((item) => item.id === 'DEMO-104')).toBe(true)
  })

  it('UT-FILTER-03: 描述子串命中（仅描述）', () => {
    const data = [makeItem('DEMO-901', { title: '无关标题', description: '这里包含验收清单的说明' })]
    expect(filterItems(data, filters({ q: '验收清单' }))).toHaveLength(1)
  })

  it('UT-FILTER-04: 拉丁字符大小写不敏感', () => {
    const data = [makeItem('DEMO-902', { title: 'Filter regression' })]
    expect(filterItems(data, filters({ q: 'FILTER' }))).toHaveLength(1)
    expect(filterItems(data, filters({ q: 'filter' }))).toHaveLength(1)
  })

  it('UT-FILTER-06: 类型筛选只返回缺陷', () => {
    const result = filterItems(seeds, filters({ type: 'defect' }))
    expect(result).toHaveLength(5)
    expect(result.every((item) => item.type === 'defect')).toBe(true)
  })

  it('UT-FILTER-07: 关键词 + 类型 + 优先级 + 状态 AND 组合', () => {
    const result = filterItems(seeds, filters({ q: '存储', type: 'defect', priority: 'P0', status: '阻塞中' }))
    expect(result.map((item) => item.id)).toEqual(['DEMO-109'])
    expect(describeFilters(filters({ q: '存储', type: 'defect', priority: 'P0', status: '阻塞中' }))).toContain('关键词「存储」')
  })

  it('UT-FILTER-08: 空白关键词视为无关键词，清空恢复全集且不改数据', () => {
    const before = JSON.stringify(seeds)
    expect(filterItems(seeds, filters({ q: '   ' }))).toHaveLength(12)
    expect(filterItems(seeds, EMPTY_FILTERS)).toHaveLength(12)
    expect(JSON.stringify(seeds)).toBe(before)
  })
})

describe('UT-STATS 统计', () => {
  it('UT-STATS-01: 种子统计 12 条、完成率 25%', () => {
    const stats = computeStats(seeds)
    expect(stats.total).toBe(12)
    expect(stats.counts).toEqual({ 待规划: 2, 进行中: 3, 审核中: 2, 阻塞中: 2, 已完成: 3 })
    expect(stats.completed).toBe(3)
    expect(stats.rate).toBe(25)
  })

  it('UT-STATS-02: 空集合返回 null 而非 NaN/Infinity', () => {
    const stats = computeStats([])
    expect(stats.total).toBe(0)
    expect(Object.values(stats.counts).every((count) => count === 0)).toBe(true)
    expect(stats.rate).toBeNull()
    expect(Number.isNaN(stats.rate as number)).toBe(false)
    expect(statusPercent(0, 0)).toBeNull()
  })

  it('UT-STATS-03/04/05: 取整规则 33/100/0', () => {
    const oneOfThree = computeStats([
      makeItem('DEMO-903', { status: '已完成' }),
      makeItem('DEMO-904'),
      makeItem('DEMO-905'),
    ])
    expect(oneOfThree.rate).toBe(33)
    expect(computeStats([makeItem('DEMO-906', { status: '已完成' })]).rate).toBe(100)
    expect(computeStats([makeItem('DEMO-907')]).rate).toBe(0)
  })

  it('UT-STATS-06: 同源集合 sum(counts)=total，分列长度=counts', () => {
    const result = filterItems(seeds, filters({ type: 'defect' }))
    const stats = computeStats(result)
    expect(Object.values(stats.counts).reduce((sum, count) => sum + count, 0)).toBe(stats.total)
    for (const [status, count] of Object.entries(stats.counts)) {
      expect(result.filter((item) => item.status === status)).toHaveLength(count)
    }
  })
})
