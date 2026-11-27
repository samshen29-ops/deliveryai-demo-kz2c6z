import { describe, expect, it } from 'vitest'
import { STATUSES, createSeedState, type Status } from '../model'
import { TRANSITIONS, canTransition, countChars, normalizeDraft, transitionItem, validateDraft, type WorkItemDraft } from '../rules'

const baseDraft = (patch: Partial<WorkItemDraft> = {}): WorkItemDraft => ({
  type: 'requirement',
  title: '合法标题',
  description: '',
  priority: 'P2',
  assignee: '示例产品',
  acceptance: '',
  ...patch,
})

const seedItem = (id: string) => {
  const item = createSeedState().items.find((candidate) => candidate.id === id)
  if (!item) throw new Error(`missing seed ${id}`)
  return item
}

describe('UT-VALID 表单校验', () => {
  it('UT-VALID-01: 合法草稿与标题 trim', () => {
    const draft = baseDraft({ title: '  合法标题  ' })
    expect(validateDraft(draft)).toEqual({})
    expect(normalizeDraft(draft).title).toBe('合法标题')
    expect(validateDraft(normalizeDraft(draft))).toEqual({})
  })

  it('UT-VALID-03: 枚举非法返回字段错误', () => {
    const errors = validateDraft(baseDraft({ type: 'story', priority: 'P9', assignee: '真实姓名' }))
    expect(errors.type).toBe('请选择需求或缺陷。')
    expect(errors.priority).toBe('请选择合法优先级。')
    expect(errors.assignee).toBe('请选择示例负责人。')
  })

  it('UT-VALID-04/05: 空标题与纯空格标题被拒绝', () => {
    expect(validateDraft(baseDraft({ title: '' })).title).toBe('标题不能为空。')
    expect(validateDraft(baseDraft({ title: '   ' })).title).toBe('标题不能为空。')
  })

  it('UT-VALID-06/07: 80 个汉字接受，81 个拒绝并显示长度', () => {
    expect(validateDraft(baseDraft({ title: '汉'.repeat(80) }))).toEqual({})
    expect(validateDraft(baseDraft({ title: '汉'.repeat(81) })).title).toBe('标题最多 80 个字符，当前 81 个。')
  })

  it('UT-VALID-08: emoji 按 Unicode 码点计数', () => {
    expect(countChars('😀')).toBe(1)
    expect(validateDraft(baseDraft({ title: '😀'.repeat(80) }))).toEqual({})
    expect(validateDraft(baseDraft({ title: '😀'.repeat(81) })).title).toContain('当前 81 个')
  })

  it('UT-VALID-09/10: 描述 2000 接受，2001 拒绝', () => {
    expect(validateDraft(baseDraft({ description: '字'.repeat(2000) })).description).toBeUndefined()
    expect(validateDraft(baseDraft({ description: '字'.repeat(2001) })).description).toBe('描述最多 2000 个字符，当前 2001 个。')
  })

  it('UT-VALID-11: 验收说明 2001 拒绝', () => {
    expect(validateDraft(baseDraft({ acceptance: '字'.repeat(2001) })).acceptance).toBe('验收说明最多 2000 个字符，当前 2001 个。')
  })

  it('UT-VALID-12: 多字段错误可同时返回，修正后消失', () => {
    const errors = validateDraft(baseDraft({ title: '', description: '字'.repeat(2001), type: 'x' }))
    expect(Object.keys(errors).sort()).toEqual(['description', 'title', 'type'])
    expect(validateDraft(baseDraft({ title: '已修正', description: '短描述' }))).toEqual({})
  })
})

describe('UT-SM 状态机', () => {
  const allowedPairs = new Set([
    '待规划→进行中',
    '进行中→审核中',
    '进行中→阻塞中',
    '阻塞中→进行中',
    '审核中→已完成',
    '审核中→进行中',
  ])

  it('UT-SM-01/12: 5×5 全矩阵仅 6 个允许组合', () => {
    const actual: string[] = []
    for (const from of STATUSES) {
      for (const to of STATUSES) {
        const expected = allowedPairs.has(`${from}→${to}`)
        expect(canTransition(from, to)).toBe(expected)
        expect(TRANSITIONS[from].includes(to)).toBe(expected)
        if (expected) actual.push(`${from}→${to}`)
      }
    }
    expect(actual.sort()).toEqual([...allowedPairs].sort())
  })

  it('UT-SM-02: 合法流转更新状态/时间并写成功历史', () => {
    const item = seedItem('DEMO-101')
    const result = transitionItem(item, '进行中', '2026-11-27T10:00:00.000Z')
    expect(result.ok).toBe(true)
    expect(result.item.status).toBe('进行中')
    expect(result.item.updatedAt).toBe('2026-11-27T10:00:00.000Z')
    expect(result.event.result).toBe('success')
    expect(result.event.from).toBe('待规划')
    expect(result.event.to).toBe('进行中')
    expect(result.event.reason.length).toBeGreaterThan(0)
    expect(result.item.history[0]).toBe(result.event)
  })

  it('UT-SM-03: 跨级流转被拒绝且原因含当前/目标/允许目标', () => {
    const item = seedItem('DEMO-101')
    const result = transitionItem(item, '已完成', '2026-11-27T10:00:00.000Z')
    expect(result.ok).toBe(false)
    expect(result.item.status).toBe('待规划')
    expect(result.event.result).toBe('rejected')
    expect(result.reason).toContain('待规划')
    expect(result.reason).toContain('已完成')
    expect(result.reason).toContain('进行中')
  })

  it('UT-SM-04: 已完成只读，任意目标均拒绝并写历史', () => {
    const item = seedItem('DEMO-110')
    for (const target of STATUSES) {
      const result = transitionItem(item, target, '2026-11-27T10:00:00.000Z')
      expect(result.ok).toBe(false)
      expect(result.item.status).toBe('已完成')
      expect(result.reason).toContain('只读')
      expect(result.reason).toContain('不会自动重开')
      expect(result.event.result).toBe('rejected')
    }
  })

  it('UT-SM-05/10: 自流转拒绝，updatedAt 更新但 status 不变', () => {
    const item = seedItem('DEMO-103')
    const result = transitionItem(item, '进行中', '2026-11-27T11:00:00.000Z')
    expect(result.ok).toBe(false)
    expect(result.item.status).toBe('进行中')
    expect(result.item.updatedAt).toBe('2026-11-27T11:00:00.000Z')
  })

  it('UT-SM-06: 新事件在数组头部，历史按时间倒序稳定展示', () => {
    const item = seedItem('DEMO-103')
    const result = transitionItem(item, '审核中', '2026-11-27T12:00:00.000Z')
    expect(result.item.history[0].at).toBe('2026-11-27T12:00:00.000Z')
    expect(result.item.history[1]).toBe(item.history[0])
  })

  it('UT-SM-07: 不修改原对象，返回新对象', () => {
    const item = seedItem('DEMO-101')
    const before = JSON.stringify(item)
    const result = transitionItem(item, '进行中', '2026-11-27T10:00:00.000Z')
    expect(JSON.stringify(item)).toBe(before)
    expect(result.item).not.toBe(item)
  })

  it('UT-SM-08: 多次合法/非法流转历史持续累积', () => {
    let item = seedItem('DEMO-103')
    const first = transitionItem(item, '审核中', '2026-11-27T10:00:00.000Z')
    item = first.item
    const second = transitionItem(item, '待规划', '2026-11-27T10:01:00.000Z')
    item = second.item
    const third = transitionItem(item, '已完成', '2026-11-27T10:02:00.000Z')
    item = third.item
    expect(item.history).toHaveLength(5)
    expect(item.history.filter((event) => event.result === 'success')).toHaveLength(4)
    expect(item.history.filter((event) => event.result === 'rejected')).toHaveLength(1)
  })

  it('UT-SM-09: 阻塞中只允许进行中，拒绝原因只列该目标', () => {
    const result = transitionItem(seedItem('DEMO-108'), '审核中', '2026-11-27T10:00:00.000Z')
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('允许的目标状态：进行中')
    expect(result.reason).not.toContain('审核中、')
  })

  it('UT-SM-11: 连续流转的事件 ID 唯一', () => {
    let item = seedItem('DEMO-102')
    const ids = new Set<string>()
    for (let index = 0; index < 10; index += 1) {
      const result = transitionItem(item, '进行中', `2026-11-27T10:0${index % 10}:00.000Z`)
      item = result.item
      ids.add(result.event.id)
    }
    expect(ids.size).toBe(10)
  })

  it('UT-SM-12: 每个组合的拒绝原因可解释', () => {
    for (const from of STATUSES) {
      const item = seedItem(from === '待规划' ? 'DEMO-101' : from === '进行中' ? 'DEMO-103' : from === '审核中' ? 'DEMO-106' : from === '阻塞中' ? 'DEMO-108' : 'DEMO-110')
      for (const to of STATUSES) {
        if (canTransition(from, to)) continue
        const result = transitionItem(item, to as Status, '2026-11-27T10:00:00.000Z')
        expect(result.ok).toBe(false)
        expect(result.reason.length).toBeGreaterThan(0)
      }
    }
  })
})
