export type StageTone = 'passed' | 'generated' | 'pending' | 'future'
export type EvidenceKindTag = 'real' | 'pending' | 'sample'

export interface StageItem {
  label: string
  status: string
  tag: EvidenceKindTag
  detail: string
  href?: string
}

export interface CapabilityStage {
  index: string
  name: string
  statusLabel: string
  tone: StageTone
  items: StageItem[]
}

export type AcStatus = 'covered' | 'partial' | 'pending'

export interface AcRow {
  id: string
  name: string
  status: AcStatus
  note: string
}

export interface ArtifactLink {
  label: string
  status: string
  href: string
  detail: string
}

export interface EvidenceSnapshot {
  generatedAt: string
  branch: string
  baseCommit: string
  commitNote: string
  stages: CapabilityStage[]
  acRows: AcRow[]
  realArtifacts: ArtifactLink[]
  pendingItems: string[]
}

const REPORT_NOTE = '单元测试与真实 E2E 结果见 docs/evidence/board/ 下的报告；本页不预填成功结论。'

export const EVIDENCE_SNAPSHOT: EvidenceSnapshot = {
  generatedAt: '2026-11-27',
  branch: 'demo/sam-sdlc-capability',
  baseCommit: '1f47ad864fb9b97835cb8a453e6ed41d132f56e1',
  commitNote: '实现提交见本分支 Git 记录；本页是构建期静态快照，不联网读取 PR/CI/平台状态。',
  stages: [
    {
      index: '01', name: '需求澄清与原型', statusLabel: '已通过', tone: 'passed',
      items: [
        { label: 'PRD Markdown', status: '已生成', tag: 'real', detail: '已评审 PRD 正文', href: 'docs/prd/requirements-defect-board.md' },
        { label: 'PRD HTML', status: '已生成', tag: 'real', detail: '静态可读版本', href: 'docs/prd/requirements-defect-board.html' },
        { label: '交互原型', status: '已生成', tag: 'real', detail: '独立静态原型 + 浏览器验收截图', href: 'docs/prototype/requirements-board/index.html' },
        { label: '浏览器验收', status: '已执行', tag: 'real', detail: '原型阶段 14/14 检查通过；不是正式 React 实现 E2E', href: 'docs/prototype/requirements-board/evidence/browser-acceptance.json' },
        { label: '用户评审', status: '已通过', tag: 'real', detail: '2026-11-27；保留火锅演示并新增默认看板入口' },
      ],
    },
    {
      index: '02', name: '产品与技术 Spec', statusLabel: '已生成 · 待评审', tone: 'generated',
      items: [
        { label: '产品 Spec', status: '已生成', tag: 'real', detail: 'REQ-001..013、AC-01..12、边界与反例', href: 'docs/spec/requirements-defect-board.spec.md' },
        { label: '技术 Design', status: '已生成', tag: 'real', detail: '路由、模块、存储状态机、证据快照', href: 'docs/spec/requirements-defect-board.design.md' },
        { label: '测试计划', status: '已生成', tag: 'real', detail: 'UT-*/E2E-* 用例、命令与判定标准', href: 'docs/spec/requirements-defect-board.test-plan.md' },
        { label: 'Spec HTML', status: '已生成', tag: 'real', detail: '静态可读版本', href: 'docs/spec/requirements-defect-board.spec.html' },
      ],
    },
    {
      index: '03', name: '开发、自测与用例', statusLabel: '已执行', tone: 'passed',
      items: [
        { label: '实现、单元测试与构建', status: '已执行', tag: 'real', detail: '实现、47 项单元测试、lint 与 build 已执行；E2E 用例已生成，正式执行见节点 5。' },
        { label: '本页证据口径', status: '待回填', tag: 'pending', detail: REPORT_NOTE },
      ],
    },
    {
      index: '04', name: '沙箱预览与冒烟', statusLabel: '未执行', tone: 'future',
      items: [
        { label: '沙箱预览与冒烟', status: '未执行', tag: 'pending', detail: '原型预览不计为正式冒烟；不声称公开发布。' },
      ],
    },
    {
      index: '05', name: '真实 E2E 与证据', statusLabel: '未执行', tone: 'future',
      items: [
        { label: '真实浏览器 E2E、HTML 报告与截图', status: '未执行', tag: 'pending', detail: '由后续节点在同一 revision 执行并回填报告路径。' },
      ],
    },
    {
      index: '06', name: '代码评审与 PR 交付', statusLabel: '未创建', tone: 'future',
      items: [
        { label: '代码审查与 open/unmerged PR', status: '未创建', tag: 'pending', detail: 'PR 创建后回填真实链接；不启用 auto-merge。' },
      ],
    },
    {
      index: '07', name: '人工发布决策', statusLabel: '待确认', tone: 'pending',
      items: [
        { label: '合并与发布决策', status: '待确认', tag: 'pending', detail: '不代用户审批；不自动合并；不公开发布。' },
      ],
    },
  ],
  acRows: [
    { id: 'AC-01', name: '12 条合成工作项、状态分组与合成标识', status: 'partial', note: '实现已落地；真实 E2E 由节点 5 执行' },
    { id: 'AC-02', name: '新增合法、编辑保存、取消无修改', status: 'partial', note: '单元测试覆盖校验；E2E 待节点 5' },
    { id: 'AC-03', name: '空白/超长标题、超长描述被拒绝且反馈清晰', status: 'partial', note: '单元测试覆盖边界；E2E 待节点 5' },
    { id: 'AC-04', name: '关键词、类型、优先级、状态组合筛选与清空', status: 'partial', note: '单元测试覆盖筛选；E2E 待节点 5' },
    { id: 'AC-05', name: '合法流转、历史、非法拒绝、已完成只读', status: 'partial', note: '25 组合矩阵单测覆盖；E2E 待节点 5' },
    { id: 'AC-06', name: '刷新保留、损坏/不可用受控反馈', status: 'partial', note: '存储分支单测覆盖；E2E 待节点 5' },
    { id: 'AC-07', name: '计数与卡片一致、完成率正确、零结果无 NaN', status: 'partial', note: '统计单测覆盖；E2E 待节点 5' },
    { id: 'AC-08', name: '详情记录与证据类型正确，示例不冒充真实', status: 'partial', note: '静态证据快照已分级；E2E 待节点 5' },
    { id: 'AC-09', name: '复位取消无变化，确认只重置本 Demo', status: 'partial', note: '复位隔离单测覆盖；E2E 待节点 5' },
    { id: 'AC-10', name: 'HTML/脚本安全显示，无真实凭据/身份/客户数据', status: 'partial', note: '纯文本渲染 + 静态扫描；E2E 待节点 5' },
    { id: 'AC-11', name: '键盘可用、窄屏无遮挡、无 console error', status: 'partial', note: 'E2E 用例已生成；正式执行见节点 5' },
    { id: 'AC-12', name: 'PRD、Spec、分支 commit、测试、预览、E2E、审查、PR', status: 'partial', note: 'PRD/Spec/Design/Test Plan 与实现提交存在；预览、E2E、PR 未执行' },
  ],
  realArtifacts: [
    { label: 'PRD Markdown', status: '已生成', href: 'docs/prd/requirements-defect-board.md', detail: '需求澄清与原型节点产物' },
    { label: 'PRD HTML', status: '已生成', href: 'docs/prd/requirements-defect-board.html', detail: '静态可读版本' },
    { label: '交互原型', status: '已生成', href: 'docs/prototype/requirements-board/index.html', detail: '原型与浏览器验收证据' },
    { label: '产品 Spec', status: '已生成 · 待评审', href: 'docs/spec/requirements-defect-board.spec.md', detail: 'AC/REQ/边界契约' },
    { label: '技术 Design', status: '已生成 · 待评审', href: 'docs/spec/requirements-defect-board.design.md', detail: '模块、存储、状态机' },
    { label: '测试计划', status: '已生成 · 待评审', href: 'docs/spec/requirements-defect-board.test-plan.md', detail: 'UT/E2E 用例与判定' },
    { label: '需求打标', status: '已生成 · 待评审', href: 'docs/spec/requirements-defect-board.tagging.md', detail: '七维评估与人工决策点' },
  ],
  pendingItems: [
    '沙箱预览与冒烟截图（节点 4）',
    '真实浏览器 E2E HTML 报告与截图（节点 5）',
    '代码审查记录与 open/unmerged PR（节点 6）',
    '人工发布决策（节点 7）',
  ],
}
