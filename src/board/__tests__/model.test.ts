import { describe, expect, it } from 'vitest'
import { ASSIGNEES, createSeedState, nextItemId, seedItems, STATUSES } from '../model'
import { computeStats } from '../query'
import { EVIDENCE_SNAPSHOT } from '../evidence'

describe('UT-SEED 种子数据', () => {
  it('UT-SEED-01: 12 条、状态分布 2/3/2/2/3、ID 唯一、完成率 25%', () => {
    const state = createSeedState()
    expect(state.items).toHaveLength(12)
    const stats = computeStats(state.items)
    expect(stats.counts).toEqual({ 待规划: 2, 进行中: 3, 审核中: 2, 阻塞中: 2, 已完成: 3 })
    expect(stats.completed).toBe(3)
    expect(stats.rate).toBe(25)
    expect(new Set(state.items.map((item) => item.id)).size).toBe(12)
    expect(state.items.map((item) => item.id)).toContain('DEMO-101')
    expect(state.items.map((item) => item.id)).toContain('DEMO-112')
    expect(state.items.every((item) => STATUSES.includes(item.status))).toBe(true)
  })

  it('UT-SEED-02: 字段齐全、示例负责人、至少 1 条示例证据和成功历史、无真实身份', () => {
    for (const item of seedItems()) {
      for (const field of ['id', 'type', 'title', 'description', 'priority', 'assignee', 'acceptance', 'status', 'createdAt', 'updatedAt'] as const) {
        expect(typeof item[field]).toBe('string')
      }
      expect(ASSIGNEES).toContain(item.assignee as (typeof ASSIGNEES)[number])
      expect(item.evidence.some((evidence) => evidence.kind === 'sample')).toBe(true)
      expect(item.history.some((event) => event.result === 'success')).toBe(true)
      expect(item.title).not.toMatch(/@[a-z0-9.-]+\.[a-z]{2,}/i)
      expect(item.description).not.toMatch(/\b1[3-9]\d{9}\b/)
    }
  })

  it('UT-VALID-02: 新建 ID 取最大数字 + 1，无 DEMO 项从 101 开始', () => {
    expect(nextItemId(seedItems())).toBe('DEMO-113')
    expect(nextItemId([])).toBe('DEMO-101')
    const state = createSeedState()
    expect(nextItemId(state.items.slice(0, 2))).toBe('DEMO-103')
  })
})

describe('UT-EVID 证据快照', () => {
  it('UT-EVID-01: 7 节点状态与评审口径一致', () => {
    expect(EVIDENCE_SNAPSHOT.stages).toHaveLength(7)
    expect(EVIDENCE_SNAPSHOT.stages[0].statusLabel).toBe('已通过')
    expect(EVIDENCE_SNAPSHOT.stages[1].statusLabel).toBe('已生成 · 待评审')
    expect(EVIDENCE_SNAPSHOT.stages[2].statusLabel).toBe('未执行')
    expect(EVIDENCE_SNAPSHOT.stages[3].statusLabel).toBe('未执行')
    expect(EVIDENCE_SNAPSHOT.stages[4].statusLabel).toBe('未执行')
    expect(EVIDENCE_SNAPSHOT.stages[5].statusLabel).toBe('未创建')
    expect(EVIDENCE_SNAPSHOT.stages[6].statusLabel).toBe('待确认')
  })

  it('UT-EVID-02: 未执行项不含 PASS/成功/已合并，也没有虚构 PR 链接', () => {
    const text = JSON.stringify(EVIDENCE_SNAPSHOT)
    expect(text).not.toMatch(/github\.com\/[^"']*\/pull\//)
    for (const stage of EVIDENCE_SNAPSHOT.stages) {
      for (const item of stage.items) {
        if (item.tag === 'pending') {
          expect(item.status).not.toMatch(/PASS|成功|已合并/i)
        }
      }
    }
  })

  it('UT-EVID-03: 真实产物均有仓库内路径，pending 项有未执行说明', () => {
    expect(EVIDENCE_SNAPSHOT.realArtifacts.length).toBeGreaterThan(0)
    for (const artifact of EVIDENCE_SNAPSHOT.realArtifacts) {
      expect(artifact.href.startsWith('docs/')).toBe(true)
      expect(artifact.href.endsWith('.md') || artifact.href.endsWith('.html')).toBe(true)
    }
    expect(EVIDENCE_SNAPSHOT.pendingItems.length).toBeGreaterThan(0)
    for (const item of EVIDENCE_SNAPSHOT.pendingItems) expect(item.length).toBeGreaterThan(0)
  })
})
