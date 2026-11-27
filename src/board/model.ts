export type WorkItemType = 'requirement' | 'defect'
export type Priority = 'P0' | 'P1' | 'P2' | 'P3'
export type Status = '待规划' | '进行中' | '审核中' | '阻塞中' | '已完成'
export type EvidenceKind = 'sample' | 'real' | 'pending'
export type EvidenceType = 'note' | 'doc' | 'test' | 'pr' | 'screenshot'

export interface HistoryEvent {
  id: string
  at: string
  from: Status | null
  to: Status
  result: 'success' | 'rejected'
  reason: string
  actor: string
}

export interface Evidence {
  id: string
  title: string
  kind: EvidenceKind
  type: EvidenceType
  status: string
  detail: string
}

export interface WorkItem {
  id: string
  type: WorkItemType
  title: string
  description: string
  priority: Priority
  assignee: string
  acceptance: string
  status: Status
  createdAt: string
  updatedAt: string
  history: HistoryEvent[]
  evidence: Evidence[]
  [extra: string]: unknown
}

export interface BoardState {
  version: 1
  items: WorkItem[]
  updatedAt: string
  [extra: string]: unknown
}

export const STORAGE_KEY = 'sdlc-demo-board:v1'
export const APP_VERSION = 1
export const TITLE_MAX = 80
export const TEXT_MAX = 2000

export const STATUSES: Status[] = ['待规划', '进行中', '审核中', '阻塞中', '已完成']

export const STATUS_META: { value: Status; key: string; label: Status }[] = [
  { value: '待规划', key: 'plan', label: '待规划' },
  { value: '进行中', key: 'progress', label: '进行中' },
  { value: '审核中', key: 'review', label: '审核中' },
  { value: '阻塞中', key: 'blocked', label: '阻塞中' },
  { value: '已完成', key: 'done', label: '已完成' },
]

export const TYPE_LABELS: Record<WorkItemType, string> = { requirement: '需求', defect: '缺陷' }
export const PRIORITIES: Priority[] = ['P0', 'P1', 'P2', 'P3']
export const ASSIGNEES = ['示例产品', '示例研发', '示例测试', '示例设计'] as const

export const isStatus = (value: unknown): value is Status => STATUSES.includes(value as Status)
export const isType = (value: unknown): value is WorkItemType => value === 'requirement' || value === 'defect'
export const isPriority = (value: unknown): value is Priority => PRIORITIES.includes(value as Priority)
export const isAssignee = (value: unknown): boolean => ASSIGNEES.includes(value as (typeof ASSIGNEES)[number])

export function uid(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso))
  } catch {
    return String(iso || '')
  }
}

export function formatFullDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso))
  } catch {
    return String(iso || '')
  }
}

const h = (
  id: string,
  at: string,
  from: Status | null,
  to: Status,
  result: 'success' | 'rejected',
  reason: string,
  actor: string,
): HistoryEvent => ({ id, at, from, to, result, reason, actor })

const sampleEvidence = (id: string, title: string, detail: string, type: EvidenceType = 'note'): Evidence => ({
  id, title, kind: 'sample', type, status: '示例', detail,
})

/** 12 条合成种子，逐字迁移自已评审原型（提交 2ca14e0 的 seedItems）。 */
export function seedItems(): WorkItem[] {
  return [
    {
      id: 'DEMO-101', type: 'requirement', title: '工作项批量导出', priority: 'P1', assignee: '示例产品', status: '待规划',
      description: '让评审者可以把当前筛选集合导出为只读清单，便于演示结束后留档。导出仅发生在浏览器内，不上传任何数据。',
      acceptance: '导出内容与当前筛选集合一致\n导出文件明确标注演示合成数据\n取消导出不改变看板数据',
      createdAt: '2026-11-18T09:10:00.000Z', updatedAt: '2026-11-18T09:10:00.000Z',
      history: [h('h-101-1', '2026-11-18T09:10:00.000Z', null, '待规划', 'success', '创建为待规划', '示例产品')],
      evidence: [
        sampleEvidence('e-101-1', '示例记录 · 需求澄清摘要', '仅用于演示，不代表真实需求评审记录。'),
        sampleEvidence('e-101-2', '示例记录 · 导出字段草案', '示例字段：ID、类型、标题、优先级、状态。'),
      ],
    },
    {
      id: 'DEMO-102', type: 'defect', title: '窄屏筛选栏溢出', priority: 'P2', assignee: '示例测试', status: '待规划',
      description: '在 390px 视口下，筛选栏的四个控件超过容器宽度，导致页面级横向滚动。需要在窄屏改为单列或两列布局。',
      acceptance: '390px 下页面无横向滚动\n筛选控件可完整操作\n看板区域自身可横向滚动',
      createdAt: '2026-11-18T10:20:00.000Z', updatedAt: '2026-11-18T10:20:00.000Z',
      history: [h('h-102-1', '2026-11-18T10:20:00.000Z', null, '待规划', 'success', '创建为待规划', '示例测试')],
      evidence: [
        sampleEvidence('e-102-1', '示例记录 · 复现步骤', '示例：390px 视口打开看板，观察筛选栏。'),
        sampleEvidence('e-102-2', '示例记录 · 窄屏截图说明', '示例截图说明，不是本轮真实执行证据。'),
      ],
    },
    {
      id: 'DEMO-103', type: 'requirement', title: '验收清单模板化', priority: 'P1', assignee: '示例产品', status: '进行中',
      description: '新增工作项时提供可复用的验收说明骨架，减少每次手写。模板只作为初始文本，用户仍可自由修改。',
      acceptance: '新增对话框可插入验收骨架\n用户修改后以用户内容为准\n取消不写入模板内容',
      createdAt: '2026-11-19T09:00:00.000Z', updatedAt: '2026-11-20T14:10:00.000Z',
      history: [
        h('h-103-1', '2026-11-19T09:00:00.000Z', null, '待规划', 'success', '创建为待规划', '示例产品'),
        h('h-103-2', '2026-11-20T14:10:00.000Z', '待规划', '进行中', 'success', '开始补充验收模板', '示例产品'),
      ],
      evidence: [
        sampleEvidence('e-103-1', '示例记录 · 模板草案', '示例模板：前置条件、操作、预期结果。'),
        sampleEvidence('e-103-2', '示例记录 · 评审备注', '示例备注，不代表真实评审结论。'),
      ],
    },
    {
      id: 'DEMO-104', type: 'defect', title: '状态历史时间显示错误', priority: 'P0', assignee: '示例研发', status: '进行中',
      description: '部分状态历史在本地时区下显示了错误的小时数。需要确认时间存储为 ISO 字符串，展示时统一按本地时区格式化。',
      acceptance: '历史时间与操作时间一致\n刷新后时间不变\n无效时间有兜底显示',
      createdAt: '2026-11-19T11:15:00.000Z', updatedAt: '2026-11-21T08:30:00.000Z',
      history: [
        h('h-104-1', '2026-11-19T11:15:00.000Z', null, '待规划', 'success', '创建为待规划', '示例测试'),
        h('h-104-2', '2026-11-21T08:30:00.000Z', '待规划', '进行中', 'success', '开始定位时间格式化逻辑', '示例研发'),
      ],
      evidence: [
        sampleEvidence('e-104-1', '示例记录 · 复现记录', '示例：跨时区打开详情，观察历史时间。'),
        sampleEvidence('e-104-2', '示例记录 · 修复思路', '示例思路：统一使用 ISO 字符串与 Intl 格式化。'),
      ],
    },
    {
      id: 'DEMO-105', type: 'requirement', title: '筛选条件记忆', priority: 'P2', assignee: '示例研发', status: '进行中',
      description: '评审者在刷新后希望保留上一次的关键词和筛选条件。仅记忆本应用筛选状态，不影响工作项数据。',
      acceptance: '刷新后恢复筛选条件\n清空筛选后记忆为空\n筛选状态不写入工作项数据',
      createdAt: '2026-11-20T10:05:00.000Z', updatedAt: '2026-11-22T09:20:00.000Z',
      history: [
        h('h-105-1', '2026-11-20T10:05:00.000Z', null, '待规划', 'success', '创建为待规划', '示例产品'),
        h('h-105-2', '2026-11-22T09:20:00.000Z', '待规划', '进行中', 'success', '开始实现筛选状态恢复', '示例研发'),
      ],
      evidence: [
        sampleEvidence('e-105-1', '示例记录 · 交互草案', '示例：筛选条件在刷新后保留。'),
        sampleEvidence('e-105-2', '示例记录 · 边界备注', '示例备注：复位时同时清除筛选。'),
      ],
    },
    {
      id: 'DEMO-106', type: 'requirement', title: '详情证据抽屉分级展示', priority: 'P1', assignee: '示例产品', status: '审核中',
      description: '详情抽屉需要把示例证据、本轮真实产物和未执行项放在同一视觉体系中，避免评审者把示例记录误读为真实执行。',
      acceptance: '三类证据有清晰标签\n示例证据不出现真实 PR 或日志\n未执行项不显示成功状态',
      createdAt: '2026-11-18T08:35:00.000Z', updatedAt: '2026-11-23T16:40:00.000Z',
      history: [
        h('h-106-1', '2026-11-18T08:35:00.000Z', null, '待规划', 'success', '创建为待规划', '示例产品'),
        h('h-106-2', '2026-11-19T09:10:00.000Z', '待规划', '进行中', 'success', '开始设计证据分级', '示例产品'),
        h('h-106-3', '2026-11-23T16:40:00.000Z', '进行中', '审核中', 'success', '提交评审', '示例产品'),
      ],
      evidence: [
        sampleEvidence('e-106-1', '示例记录 · 证据分级草案', '示例草案：示例记录、真实产物、未执行。'),
        sampleEvidence('e-106-2', '示例记录 · 评审意见摘要', '示例意见，不代表真实评审通过。'),
      ],
    },
    {
      id: 'DEMO-107', type: 'defect', title: '空集合完成率显示 NaN', priority: 'P1', assignee: '示例测试', status: '审核中',
      description: '当筛选结果为空时，完成率计算出现 0/0，页面显示 NaN。需要改为“无数据”，并保持各状态计数为 0。',
      acceptance: '空集合完成率显示无数据\n空集合计数全部为 0\n恢复筛选后完成率重新计算',
      createdAt: '2026-11-20T13:25:00.000Z', updatedAt: '2026-11-24T10:05:00.000Z',
      history: [
        h('h-107-1', '2026-11-20T13:25:00.000Z', null, '待规划', 'success', '创建为待规划', '示例测试'),
        h('h-107-2', '2026-11-21T09:00:00.000Z', '待规划', '进行中', 'success', '开始修复统计边界', '示例研发'),
        h('h-107-3', '2026-11-24T10:05:00.000Z', '进行中', '审核中', 'success', '提交审核', '示例研发'),
      ],
      evidence: [
        sampleEvidence('e-107-1', '示例记录 · 复现步骤', '示例：搜索一个不存在的关键词，观察完成率。'),
        sampleEvidence('e-107-2', '示例记录 · 验收备注', '示例备注：空集合显示“无数据”。'),
      ],
    },
    {
      id: 'DEMO-108', type: 'requirement', title: '接入外部缺陷同步', priority: 'P1', assignee: '示例研发', status: '阻塞中',
      description: '把外部缺陷系统的条目同步到看板。该能力涉及外部系统、凭据与权限，本演示不接入真实系统，仅保留为阻塞示例。',
      acceptance: '外部系统未授权前不发起连接\n示例数据与真实同步明确区分\n不引入真实凭据',
      createdAt: '2026-11-17T09:45:00.000Z', updatedAt: '2026-11-23T11:30:00.000Z',
      history: [
        h('h-108-1', '2026-11-17T09:45:00.000Z', null, '待规划', 'success', '创建为待规划', '示例产品'),
        h('h-108-2', '2026-11-18T10:15:00.000Z', '待规划', '进行中', 'success', '开始调研同步方案', '示例研发'),
        h('h-108-3', '2026-11-22T15:20:00.000Z', '进行中', '阻塞中', 'success', '等待外部系统授权', '示例研发'),
        h('h-108-4', '2026-11-23T11:30:00.000Z', '阻塞中', '已完成', 'rejected', '不允许从「阻塞中」直接流转到「已完成」。允许的目标状态：进行中。', '示例研发'),
      ],
      evidence: [
        sampleEvidence('e-108-1', '示例记录 · 阻塞说明', '示例：外部系统授权未就绪。'),
        { id: 'e-108-2', title: '外部系统联调', kind: 'pending', type: 'test', status: '未执行', detail: '本演示不接入真实外部系统，未执行联调。' },
      ],
    },
    {
      id: 'DEMO-109', type: 'defect', title: '本地存储损坏时白屏', priority: 'P0', assignee: '示例研发', status: '阻塞中',
      description: '当 localStorage 中的本应用数据损坏时，应用初始化抛错并白屏。需要保留原始数据、降级到合成种子，并给出可理解的恢复入口。',
      acceptance: '损坏数据不导致白屏\n原始内容不被静默覆盖\n提供导出与显式覆盖入口',
      createdAt: '2026-11-19T15:10:00.000Z', updatedAt: '2026-11-23T09:15:00.000Z',
      history: [
        h('h-109-1', '2026-11-19T15:10:00.000Z', null, '待规划', 'success', '创建为待规划', '示例测试'),
        h('h-109-2', '2026-11-20T09:30:00.000Z', '待规划', '进行中', 'success', '开始复现损坏场景', '示例研发'),
        h('h-109-3', '2026-11-23T09:15:00.000Z', '进行中', '阻塞中', 'success', '等待确定恢复交互', '示例研发'),
      ],
      evidence: [
        sampleEvidence('e-109-1', '示例记录 · 损坏样例', '示例：写入非法 JSON 后刷新。'),
        sampleEvidence('e-109-2', '示例记录 · 恢复策略', '示例：保留原始 key，提供导出和覆盖。'),
      ],
    },
    {
      id: 'DEMO-110', type: 'requirement', title: '关键词搜索覆盖描述', priority: 'P2', assignee: '示例产品', status: '已完成',
      description: '搜索不仅匹配标题，也匹配描述中的关键词，方便按业务上下文定位工作项。',
      acceptance: '标题命中可被搜索\n描述命中可被搜索\n大小写不敏感',
      createdAt: '2026-11-10T09:00:00.000Z', updatedAt: '2026-11-16T17:20:00.000Z',
      history: [
        h('h-110-1', '2026-11-10T09:00:00.000Z', null, '待规划', 'success', '创建为待规划', '示例产品'),
        h('h-110-2', '2026-11-12T10:20:00.000Z', '待规划', '进行中', 'success', '开始实现搜索', '示例研发'),
        h('h-110-3', '2026-11-15T14:00:00.000Z', '进行中', '审核中', 'success', '提交审核', '示例研发'),
        h('h-110-4', '2026-11-16T17:20:00.000Z', '审核中', '已完成', 'success', '验收通过并完成', '示例测试'),
      ],
      evidence: [
        sampleEvidence('e-110-1', '示例记录 · 搜索验收', '示例：标题与描述均可命中。'),
        sampleEvidence('e-110-2', '示例记录 · 完成备注', '示例完成备注，不代表真实上线。'),
      ],
    },
    {
      id: 'DEMO-111', type: 'defect', title: '卡片点击区域不一致', priority: 'P1', assignee: '示例测试', status: '已完成',
      description: '卡片只有标题区域可点击，底部负责人区域无法打开详情。需要让整张卡片成为可聚焦的按钮。',
      acceptance: '整张卡片可点击\n键盘可聚焦并回车打开\n焦点样式可见',
      createdAt: '2026-11-11T11:30:00.000Z', updatedAt: '2026-11-18T15:10:00.000Z',
      history: [
        h('h-111-1', '2026-11-11T11:30:00.000Z', null, '待规划', 'success', '创建为待规划', '示例测试'),
        h('h-111-2', '2026-11-13T09:40:00.000Z', '待规划', '进行中', 'success', '开始修复点击区域', '示例研发'),
        h('h-111-3', '2026-11-17T16:00:00.000Z', '进行中', '审核中', 'success', '提交审核', '示例研发'),
        h('h-111-4', '2026-11-18T15:10:00.000Z', '审核中', '已完成', 'success', '回归通过并完成', '示例测试'),
      ],
      evidence: [
        sampleEvidence('e-111-1', '示例记录 · 回归步骤', '示例：点击卡片底部区域打开详情。'),
        sampleEvidence('e-111-2', '示例记录 · 键盘检查', '示例：Tab 聚焦卡片，回车打开。'),
      ],
    },
    {
      id: 'DEMO-112', type: 'requirement', title: '合成数据标识与演示说明', priority: 'P1', assignee: '示例产品', status: '已完成',
      description: '在页面固定位置说明所有数据为合成数据，并提供如何演示入口，避免评审者把演示数据误认为真实业务数据。',
      acceptance: '主页面固定展示合成数据标识\n演示指南包含授权边界\n证据页区分真实产物与未执行项',
      createdAt: '2026-11-12T08:50:00.000Z', updatedAt: '2026-11-20T13:45:00.000Z',
      history: [
        h('h-112-1', '2026-11-12T08:50:00.000Z', null, '待规划', 'success', '创建为待规划', '示例产品'),
        h('h-112-2', '2026-11-14T11:00:00.000Z', '待规划', '进行中', 'success', '开始补充演示说明', '示例产品'),
        h('h-112-3', '2026-11-18T10:30:00.000Z', '进行中', '审核中', 'success', '提交审核', '示例产品'),
        h('h-112-4', '2026-11-20T13:45:00.000Z', '审核中', '已完成', 'success', '验收通过并完成', '示例测试'),
      ],
      evidence: [
        sampleEvidence('e-112-1', '示例记录 · 演示脚本', '示例：5 分钟演示路径。'),
        sampleEvidence('e-112-2', '示例记录 · 边界说明', '示例：不合并、不发布、不改 main。'),
      ],
    },
  ]
}

export function createSeedState(): BoardState {
  return {
    version: APP_VERSION,
    items: JSON.parse(JSON.stringify(seedItems())) as WorkItem[],
    updatedAt: '2026-11-27T08:00:00.000Z',
  }
}

export function nextItemId(items: WorkItem[]): string {
  let max = 100
  for (const item of items) {
    const match = /^DEMO-(\d+)$/.exec(item.id)
    if (match) max = Math.max(max, Number(match[1]))
  }
  return `DEMO-${max + 1}`
}
