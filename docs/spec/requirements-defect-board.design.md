---
spec_id: SDLC-BOARD-SPEC-001
title: 研发需求与缺陷看板
status: in_review
template_id: 技术设计模板
schema_version: 1
linked_spec: SDLC-BOARD-SPEC-001
baseline_design: docs/prototype/requirements-board/ @ 2ca14e0
depends_on_designs: []
supersedes_designs: []
created_at: 2026-11-27
updated_at: 2026-11-27
revision: 1
---

# Design: 研发需求与缺陷看板

> Spec 回答 What/Why，Design 回答 How。标识符沿用 Spec 的 REQ/AC/D-/B-/U- 编号，不重新编号。
> 如果 Design 与 Spec 冲突，以 Spec 为准。本节点只写设计，不落地实现代码。

---

# 1. 方案概述

在现有 React SPA 中新增独立的 `BoardView`，以 `#/board` 作为默认入口；保留既有火锅演示的 `#/home` 到 `#/checkout` 路由与组件。看板的所有业务规则拆为 `src/board/` 下的纯函数模块，UI 只负责渲染和事件转发；持久化通过可注入的 `StorageLike` 适配器隔离，便于单测损坏、不可用和写入失败分支；证据页使用构建期静态快照，不联网读取 PR/CI/平台状态。

核心思路：

1. **领域与 UI 分离**：种子、校验、筛选、统计、状态机、存储、证据快照均为纯函数/常量；React 组件只消费结果。
2. **单一数据源**：`BoardState` 是唯一可变数据源；所有派生数据（筛选集合、统计、列计数、完成率）由同一份 `filteredItems` 计算。
3. **显式失败**：状态流转、存储损坏、写入失败都返回结构化结果，UI 显示可解释原因，不静默吞错。
4. **最小依赖**：运行时零新增依赖；仅新增开发依赖 `vitest` 用于纯函数单测；E2E 复用现有 Playwright。
5. **可回滚**：新代码集中在 `src/board/`、`src/components/board/`、`e2e/board.spec.ts`；数据使用独立 key；不改 `main`。

## 1.1 影响范围

| 模块 / 层 | 文件或目录 | 改动说明 | 关联需求 |
| --- | --- | --- | --- |
| 路由 | `src/types.ts`、`src/hooks/useViewRoute.ts`、`src/App.tsx` | 新增 `board` 视图；根地址默认 `board`；非法 hash 回落 `board`；看板无需桌台 | REQ-013 |
| 看板 UI | `src/components/board/*` | 主页、统计、筛选、列、卡片、详情、表单、复位、证据、指南 | REQ-001..REQ-012 |
| 领域逻辑 | `src/board/*.ts` | 类型、种子、校验、筛选、统计、状态机、存储、证据快照、copy | REQ-001..REQ-011 |
| 状态管理 | `src/board/useBoard.ts` | 加载、保存、派生数据、操作封装 | REQ-002..REQ-010 |
| 既有首页 | `src/components/HomeView.tsx` | 增加“SDLC 看板”入口，不改点单逻辑 | REQ-013 |
| 全局样式 | `src/index.css`（仅在必要时） | 复用现有 `paper-noise`、过渡；不新增设计系统 | REQ-012 |
| 测试 | `src/board/__tests__/*.test.ts`、`e2e/board.spec.ts`、`e2e/view-routing.spec.ts`、`e2e/super-spicy.spec.ts` | 新增单测/E2E；调整既有导航 helper | AC-01..AC-12 |
| 配置 | `package.json`、`package-lock.json`、`vite.config.ts` | 新增 `vitest` devDependency、`test:unit` 脚本与 test 配置 | D-04 |
| 文档 | `docs/spec/*`、`AGENTS.md`、`README.md` | Spec/Design/Test Plan；后续节点同步命令与入口说明 | AC-12 |

## 1.2 关键决策

| 编号 | 决策 | 选择 | 理由 | 影响 |
| --- | --- | --- | --- | --- |
| D-01 | 默认入口 | 根地址 → `#/board`，火锅 → `#/home` | 用户已确认默认看板入口；演示第一步即看板 | 既有路由 E2E 需调整 helper |
| D-02 | 看板文案 | 独立 `src/board/copy.ts`，中文单页 | 需求明确中文；避免为演示新增大量 en 文案 | 不接入 i18n 双语；在 README 说明 |
| D-03 | 逻辑组织 | `src/board/` 纯函数 + `src/components/board/` UI | 可单测、可复用、降低组件耦合 | 文件数增加，但边界清晰 |
| D-04 | 单测框架 | `vitest`（devDependency），`npm run test:unit` | 与 Vite 同栈、零运行时依赖、配置最小 | 新增 lockfile 变更 |
| D-05 | 状态目标下拉 | 列出全部非当前状态，允许尝试非法流转 | AC-05 需要可演示、可 E2E 的拒绝路径 | 用户可能先选到非法目标，需清晰提示 |
| D-06 | 证据数据 | `src/board/evidence.ts` 静态快照 | 无后端、CSP 友好、不伪造平台状态 | 每次节点交付需手动更新快照 |
| D-07 | 存储适配 | `StorageLike` 注入，默认真实 localStorage | 单测可覆盖损坏/不可用/配额分支 | 组件需通过 hook 使用适配器 |
| D-08 | 既有 E2E | helper 改 `page.goto('/#/home')`，保留业务断言 | 默认入口变化的最小兼容改动 | 需回归 17 条既有用例 |

---

# 2. 实现设计

## 2.1 文件清单

### 新增

| 文件路径 | 职责 |
| --- | --- |
| `src/board/model.ts` | 类型、枚举常量、12 条种子、`createSeedState()`、`nextItemId()`、证据快照类型 |
| `src/board/rules.ts` | 表单校验、Unicode 计数、存储结构校验、状态机 `TRANSITIONS/canTransition/transitionItem` |
| `src/board/query.ts` | `filterItems()`、`computeStats()`、筛选描述、空筛选常量 |
| `src/board/storage.ts` | `StorageLike`、`loadBoard()`、`saveBoard()`、`resetBoard()`、`exportRaw()` |
| `src/board/evidence.ts` | 7 节点能力快照、真实产物条目、AC 追溯数据 |
| `src/board/copy.ts` | 中文文案常量（标签、提示、错误、指南） |
| `src/board/useBoard.ts` | React hook：加载、持久化状态、操作、派生数据 |
| `src/components/board/BoardView.tsx` | 看板壳、顶部导航、标题/合成数据条、统计、筛选、存储警告、Toast、视图切换 |
| `src/components/board/BoardColumns.tsx` | 5 列状态泳道、列计数、工作项卡片、空态 |
| `src/components/board/ItemDetail.tsx` | 详情侧栏、状态流转、历史、证据、元数据 |
| `src/components/board/ItemFormDialog.tsx` | 新增/编辑表单、字段错误、焦点管理 |
| `src/components/board/ResetDialog.tsx` | 两步复位确认 |
| `src/components/board/EvidenceView.tsx` | 能力证据 7 节点 + AC 追溯 |
| `src/components/board/GuideView.tsx` | 5 分钟演示脚本、角色、边界 |
| `src/board/__tests__/model.test.ts` | 种子数量/状态分布/ID/示例证据/证据常量 |
| `src/board/__tests__/rules.test.ts` | 校验边界/枚举/trim/Unicode/状态机 25 组合/拒绝原因/历史 |
| `src/board/__tests__/query.test.ts` | 关键词/大小写/组合/清空/统计/空集合/取整 |
| `src/board/__tests__/storage.test.ts` | 空/合法/损坏/不可用/写入失败/未知字段/复位隔离 |
| `e2e/board.spec.ts` | AC-01..AC-11 真实浏览器 E2E（可拆 keyboard 文件） |

### 修改

| 文件路径 | 改动 |
| --- | --- |
| `src/types.ts` | `ViewName` 增加 `'board'` |
| `src/hooks/useViewRoute.ts` | `VIEWS` 增加 `board`；非法/不可达回落 `board` |
| `src/App.tsx` | 增加 `BoardView` 分支；`createInitialState` 默认 `board`；`canView` 允许 `board` |
| `src/components/HomeView.tsx` | 增加返回 `#/board` 的入口（不改点单行为） |
| `package.json` | 新增 `test:unit` 脚本与 `vitest` devDependency |
| `vite.config.ts` | 增加 `test` 配置（environment: node，include `src/board/**/*.test.ts`） |
| `e2e/view-routing.spec.ts` | 导航 helper 改 `/#/home`；ROUTE-001/006 断言调整；新增 `#/home` 与 `#/board` 用例 |
| `e2e/super-spicy.spec.ts` | `goToBrothSpec` 改 `page.goto('/#/home')` |
| `AGENTS.md` | 补充看板目录、命令、localStorage key、默认路由 |
| `README.md` | 补充看板启动/演示入口与测试命令 |

> 预估实现涉及 19 个新增代码/测试文件 + 10 个修改文件（其中 4 个 src、2 个配置、2 个既有测试、2 个文档）；不包含 lockfile 与截图等生成物。该规模对应需求打标 scope WARN，整体 B 类，见 `requirements-defect-board.tagging.md`。

## 2.2 数据模型

数据模型以 Spec §6.1 为准。实现补充：

- `STATUS_META`：状态顺序、展示名、颜色 key，固定 `待规划/进行中/审核中/阻塞中/已完成`。
- `TYPE_LABELS`：`requirement → 需求`、`defect → 缺陷`。
- `PRIORITIES`：`['P0','P1','P2','P3']`。
- `ASSIGNEES`：`['示例产品','示例研发','示例测试','示例设计']`。
- `APP_VERSION = 1`、`STORAGE_KEY = 'sdlc-demo-board:v1'`。
- `EMPTY_FILTERS = { q: '', type: 'all', priority: 'all', status: 'all' }`。
- 未知字段：`WorkItem`/`BoardState` 允许索引签名；加载时保留原始对象，编辑时用 `{...item, ...knownFields}` 回写。

## 2.3 数据库变更

无。纯前端 localStorage，无数据库、无迁移、无 DDL。

## 2.4 接口变更

无后端接口。新增内部模块契约如下（供节点 3 实现与单测使用）：

```ts
// rules.ts
export interface WorkItemDraft {
  type: string
  title: string
  description: string
  priority: string
  assignee: string
  acceptance: string
}
export type FieldErrors = Partial<Record<keyof WorkItemDraft, string>>

export function countChars(value: string): number
export function validateDraft(draft: WorkItemDraft): FieldErrors
export function normalizeDraft(draft: WorkItemDraft): WorkItemDraft // trim title only
export function validateBoardState(value: unknown):
  | { ok: true; state: BoardState }
  | { ok: false; reason: string }

// query.ts
export interface BoardFilters {
  q: string
  type: 'all' | WorkItemType
  priority: 'all' | Priority
  status: 'all' | Status
}
export function filterItems(items: WorkItem[], filters: BoardFilters): WorkItem[]
export function hasActiveFilters(filters: BoardFilters): boolean
export function describeFilters(filters: BoardFilters): string

// query.ts
export interface BoardStats {
  total: number
  counts: Record<Status, number>
  completed: number
  rate: number | null
}
export function computeStats(items: WorkItem[]): BoardStats

// rules.ts
export const TRANSITIONS: Record<Status, Status[]>
export function canTransition(from: Status, to: Status): boolean
export interface TransitionResult {
  ok: boolean
  item: WorkItem
  reason: string
  event: HistoryEvent
}
export function transitionItem(item: WorkItem, target: Status, now: string, actor?: string): TransitionResult

// storage.ts
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
export function loadBoard(storage: StorageLike | null): LoadResult
export function saveBoard(storage: StorageLike | null, state: BoardState, options?: { allowCorruptOverwrite?: boolean }): SaveResult
export function resetBoard(storage: StorageLike | null, seed: BoardState): SaveResult
export function exportRaw(raw: string): void // Blob 下载；单测不调用

// model.ts
export function createSeedState(): BoardState
export function nextItemId(items: WorkItem[]): string

// evidence.ts
export interface EvidenceSnapshot {
  generatedAt: string
  branch: string
  commit: string
  stages: CapabilityStage[]
  acRows: AcRow[]
}
export const EVIDENCE_SNAPSHOT: EvidenceSnapshot
```

组件契约：

```ts
// BoardView.tsx
interface BoardViewProps { onExit: () => void } // 进入火锅演示 #/home

// ItemDetail.tsx
interface ItemDetailProps {
  item: WorkItem
  open: boolean
  onClose: () => void
  onEdit: (id: string) => void
  onTransition: (id: string, target: Status) => void
  transitionNotice: string | null
}

// ItemFormDialog.tsx
interface ItemFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initial?: WorkItem
  onCancel: () => void
  onSubmit: (draft: WorkItemDraft) => void
}
```

## 2.5 核心流程

### 2.5.1 启动与路由

1. `main.tsx` 挂载 `App`。
2. `createInitialState()` 读取 `initialViewFromHash()`：
   - 无 hash → `view: 'board'`。
   - hash 为 `#/home`/`#/welcome`/`#/menu`/`#/order`/`#/checkout` → 保持既有逻辑；非 `home` 自动绑定示例桌台。
   - hash 为 `#/board` → `view: 'board'`，不绑定桌台。
   - 非法 hash → `view: 'board'`（由 `useViewRoute` 规范化）。
3. `App` 渲染分支顺序：先判断 `board` 返回 `BoardView`；再判断 `home` 或无桌台返回 `HomeView`；其余进入既有 welcome/menu/order/checkout。
4. `canView(view)` 改为 `view === 'board' || view === 'home' || !!state.table`。
5. `useViewRoute` 的 `VIEWS` 增加 `'board'`；`hashToView` 识别 `board`；不可达/非法回落 `board`。
6. 看板侧栏“火锅演示”使用 `<a href="#/home">` 或 `onExit`；火锅首页增加 `<a href="#/board">SDLC 看板</a>`。

### 2.5.2 加载与持久化

1. `useBoard()` 初始化时调用 `loadBoard(getStorage())`。
2. `getStorage()` 用 try/catch 访问 `window.localStorage`；异常返回 `null`。
3. `loadBoard`：
   - `storage === null` → `unavailable` + 种子 + 原因。
   - `getItem` 抛错 → `unavailable` + 种子。
   - `raw === null` → `empty` + 种子（不立即写入，首次操作再写）。
   - `JSON.parse` 失败或 `validateBoardState` 失败 → `corrupt` + 种子 + 原始 raw + 原因。
   - 合法 → `ok` + 解析后的 state。
4. 保存入口统一为 `commit(nextState, options)`：
   - `mode === 'corrupt'` 且未显式覆盖 → 保留内存态，标记 dirty，显示警告，不写 raw。
   - 否则调用 `saveBoard`；成功 → 清除警告；失败 → `write-error` + 内存态 + 重试入口。
5. 损坏恢复：
   - “导出原始数据”：将 raw 作为 `sdlc-demo-board-corrupt.json` Blob 下载；不改存储。
   - “用当前数据覆盖”：用户显式确认后写入当前 12 条种子或当前内存态；这是唯一允许覆盖损坏 raw 的路径（复位确认也算）。
6. 不调用 `localStorage.removeItem` 清除其他 key；复位使用 `setItem(STORAGE_KEY, seed)`。

### 2.5.3 新增/编辑

1. 打开新增：`mode='create'`，默认 `{type:'requirement', title:'', description:'', priority:'P2', assignee:'示例产品', acceptance:''}`。
2. 打开编辑：复制当前工作项字段；不传 `status`。
3. 提交：
   - `normalizeDraft` 只 trim 标题。
   - `validateDraft` 返回 `FieldErrors`；非空则设置 `aria-invalid`、聚焦第一个错误、保留输入、Toast 错误。
   - 合法：
     - create：`nextItemId`、`createdAt/updatedAt = now`、`status='待规划'`、创建历史、sample 证据、`items=[newItem, ...items]`。
     - edit：`{...item, ...draft, title: trimmed, updatedAt: now}`；保留 status/history/evidence/createdAt/id 与未知字段。
   - `commit(nextState)`；成功关闭对话框；失败仍关闭但显示持久化警告。
4. 取消：直接关闭，不调用 `commit`，不修改 `state`。

### 2.5.4 状态流转

1. 详情侧栏目标下拉：`allTargets = STATUS.filter(s => s !== item.status)`；允许项排在前面并标注“允许”；已完成不渲染下拉。
2. 提交：
   - `transitionItem(item, target, now)` 纯函数返回 `{ok,item,reason,event}`。
   - `ok`：用返回的新 item 替换数组项；`commit`；Toast 成功；清空 transitionNotice。
   - `!ok`：用返回的新 item（含拒绝历史）替换；`commit`；设置 `transitionNotice=reason`；Toast 错误。
3. 拒绝历史也持久化；刷新后仍可见。
4. 已完成：不渲染编辑/流转；若通过过期 UI 调用，`transitionItem` 仍返回拒绝 + 历史。

### 2.5.5 筛选与统计

1. `useBoard` 维护 `filters`（内存态，不持久化）。
2. `filteredItems = filterItems(state.items, filters)`。
3. `stats = computeStats(filteredItems)`。
4. `BoardColumns` 对 `filteredItems` 按状态分列，列计数取 `stats.counts[status]` 或同源 `filter` 长度；二者必须一致。
5. 清空：`setFilters(EMPTY_FILTERS)`；不调用 commit，不改 items。

### 2.5.6 复位

1. 打开复位：`step=1`，焦点到“继续复位”。
2. 取消/Esc/遮罩：关闭，`step` 丢弃，不 commit。
3. 继续：`step=2`，焦点到“确认重置”。
4. 确认：`createSeedState()`；清空 filters；关闭详情；`resetBoard` 写入本应用 key；Toast 成功/失败提示；不改其他 key。

### 2.5.7 证据与指南

1. `EVIDENCE_SNAPSHOT` 在构建期包含：`generatedAt`、`branch`、`commit`、7 个 stage、AC 行。
2. 节点 1：`已通过`（PRD/原型/浏览器验收/用户评审）。
3. 节点 2：`已生成 · 待评审`（Spec/Design/Test Plan）；不得写 `已通过`。
4. 节点 3-6：`未执行`/`未创建`；节点 7：`待确认`。
5. 真实产物链接只使用仓库相对路径（`../prd/...`、`./requirements-defect-board.spec.html` 等）；不链接 PR/CI。
6. `GuideView` 展示 5 步脚本、四角色、边界说明。

## 2.6 状态变化

| 操作 | 前置 | 目标 | 说明 |
| --- | --- | --- | --- |
| 新增 | 无 | 待规划 | 表单不可选状态 |
| 合法流转 | 见矩阵 | 见矩阵 | 写 success 历史 |
| 非法流转 | 任意 | 不变 | 写 rejected 历史；更新 updatedAt |
| 编辑 | 非已完成 | 状态不变 | 保留历史/证据 |
| 复位 | 任意 | 12 条种子 | 只重置本应用 key |
| 存储损坏 | corrupt | 内存种子 | 原始 raw 保留，显式覆盖前不写 |
| 存储不可用 | unavailable | 内存种子 | 操作可用，刷新丢失 |

## 2.7 异步处理

无后端请求、无定时任务、无异步队列。仅浏览器下载（导出原始数据）使用 Blob + `<a download>`，同步触发。

## 2.8 外部依赖

| 依赖 | 用途 | 超时/重试 | 降级 |
| --- | --- | --- | --- |
| `@radix-ui/react-dialog`（已有） | 表单/复位对话框、详情侧栏焦点陷阱 | 无网络 | 已有依赖，不新增 |
| `lucide-react`（已有） | 图标 | 无 | 已有 |
| `vitest`（新增 devDependency） | 纯函数单测 | 本地执行 | 仅开发期；不进产物 |
| Playwright（已有） | E2E | 本地/沙箱 | 已有 |

不新增运行时依赖；不新增外部 API、字体、图片、脚本或分析服务。既有 Google Fonts `@import` 为仓库现状，不在本需求新增，E2E 允许其网络噪声但需记录。

## 2.9 配置

| 配置项 | 默认值 | 用途 | 生效范围 |
| --- | --- | --- | --- |
| `STORAGE_KEY` | `sdlc-demo-board:v1` | 本应用存储 key | 浏览器 localStorage |
| `APP_VERSION` | `1` | 存储结构版本 | 加载校验 |
| `TITLE_MAX` | `80` | 标题上限 | 校验/计数器 |
| `TEXT_MAX` | `2000` | 描述/验收上限 | 校验/计数器 |
| `npm run test:unit` | `vitest run` | 单测 | 开发/CI |
| `PLAYWRIGHT_CHROMIUM_PATH` | `/opt/chromium.org/chromium/chrome` | 浏览器路径 | E2E |

---

# 3. 兼容性与迁移

| 影响对象 | 兼容策略 | 迁移步骤 |
| --- | --- | --- |
| 既有火锅路由 | 保留 `#/home`..`#/checkout`；仅默认入口与非法回落改为 `board` | 无数据迁移；更新导航 helper |
| 既有 17 条 E2E | helper 改 `/#/home`；保留业务断言；新增 board 用例 | 节点 3 一次性调整并全量回归 |
| 既有 localStorage key | 不读取、不写入、不清空 `i18nextLng`、`elderly-mode` | 无 |
| 新 key `sdlc-demo-board:v1` | 新装为空 → 种子；旧版本无此 key | 无需迁移；版本不匹配按损坏处理 |
| 既有 UI 组件 | 复用 Button/Dialog/色板；不引入 UI 库 | 无 |
| 既有 `server/` | 不改 | 无 |

- 不修改 `main`；所有变更在 `demo/sam-sdlc-capability`。
- 不更新 GitHub Pages；Actions 仅 `main` 触发，分支推送与 PR 不触发公开部署。
- 若未来发布，需另行走人工发布决策；本 Design 不包含发布步骤。

---

# 4. 上线与回滚

| 步骤 | 动作 | 备注 |
| --- | --- | --- |
| 1 | 节点 3 实现并提交到独立分支 | 不合并 |
| 2 | 节点 4 沙箱预览与冒烟 | 端口暴露 409 时用沙箱内 URL |
| 3 | 节点 5 真实 E2E 与证据 | 同一 revision |
| 4 | 节点 6 代码评审与 open/unmerged PR | 不启用 auto-merge |
| 5 | 节点 7 人工发布决策 | 不代用户审批 |

**回滚预案**：

- 代码：回退 `demo/sam-sdlc-capability` 上的看板提交，或关闭 PR；不触碰 `main`。
- 数据：用户可执行演示复位恢复 12 条种子；损坏数据先导出再显式覆盖；不调用 `localStorage.clear()`。
- 发布：本需求不发布、不合并，无生产回滚动作。
- 若默认入口变更导致既有演示不可用：将 `createInitialState` 默认值改回 `home`，保留 `#/board` 入口，作为最小回滚。

---

# 5. 风险

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| 默认入口改为 board 破坏既有 E2E | 17 条回归失败 | 统一 helper 到 `/#/home`；节点 3 全量回归；保留业务断言 |
| 原型与 React 实现行为差异 | 评审结论不一致 | 以 Spec/AC 为准；纯函数单测覆盖边界；E2E 复核 |
| 存储损坏处理不当导致数据丢失 | 用户数据被覆盖 | raw 保留、显式覆盖、导出、单测覆盖 |
| 证据页被误读为平台结果 | 演示可信度受损 | 静态快照 + 三类标签 + 未执行项无 PASS |
| 非法流转下拉让用户困惑 | 误操作 | 允许项优先并标注；拒绝原因清晰；历史可见 |
| 390px 看板横向滚动不易发现 | 核心内容看似缺失 | 列容器滚动提示；页面级无溢出；截图验收 |
| Vitest 新增依赖与锁文件变化 | 构建/安装风险 | 仅 devDependency；`npm ci` 验证；不进产物 |
| 沙箱端口暴露 409 | 无公开预览 URL | 沙箱内预览 + 截图/报告；不声称公开发布 |
| 多标签页并发写入 | 后写覆盖 | 明确不支持；文档记录；不作为 AC |
| 已有 Google Fonts 外链失败 | 字体回退 | 既有行为；E2E 记录网络噪声，不误判为 console error |

---

# 6. 测试要点

| 场景 | 方法 | 关联 REQ/AC |
| --- | --- | --- |
| 种子与状态分布 | Vitest `model.test.ts` | REQ-001 / AC-01 |
| 新增/编辑/取消 | Vitest rules + Playwright | REQ-002/003 / AC-02 |
| 标题/描述/验收边界 | Vitest 参数化边界 + E2E | REQ-004 / AC-03 |
| 搜索/组合筛选/清空/空态 | Vitest query + E2E | REQ-005 / AC-04 |
| 状态机 25 组合/拒绝/只读 | Vitest 全矩阵 + E2E | REQ-006 / AC-05 |
| 存储合法/损坏/不可用/写入失败/未知字段 | Vitest fake storage + E2E | REQ-009 / AC-06 |
| 统计与卡片同源/空集合 | Vitest query + E2E | REQ-007 / AC-07 |
| 详情/证据标签/无 PASS | Vitest model/evidence 常量 + E2E | REQ-008/011 / AC-08 |
| 复位取消/确认/其他 key | Vitest storage + E2E | REQ-010 / AC-09 |
| XSS/凭据/身份 | E2E + 静态检索 | REQ-012 / AC-10 |
| 键盘/390px/console | E2E 专项 | REQ-012 / AC-11 |
| 默认入口/火锅回归 | Playwright 路由用例 | REQ-013 / AC-12 |

详细用例、命令、报告格式与 PASS 判定见 `requirements-defect-board.test-plan.md`。

---

# 7. 实施顺序（节点 3）

1. 新建 `src/board/model.ts`、`copy.ts`、`evidence.ts`，从原型逐字迁移 12 条种子；先写 `model.test.ts` 锁定数量/状态分布/ID。
2. 实现 `rules.ts` 中的校验与边界单测（空/80/81/emoji/2000/2001/枚举/trim）。
3. 实现 `query.ts` 与单测（大小写/子串/AND/空集合/取整）。
4. 实现 `rules.ts` 中的状态机与 25 组合矩阵单测（含拒绝原因/历史/不可变）。
5. 实现 `storage.ts` 与 fake storage 单测（空/合法/损坏/不可用/写入失败/未知字段/复位隔离）。
6. 实现 `useBoard.ts`，串联加载、提交、派生数据、操作。
7. 实现 `BoardView` 及子组件，复用 Button/Dialog/lucide/Tailwind token；完成桌面与 390px 布局。
8. 调整 `types.ts`、`useViewRoute.ts`、`App.tsx`、`HomeView.tsx` 路由；补 `#/board` 与 `#/home` 入口。
9. 新增 `e2e/board.spec.ts`；调整既有 E2E helper；跑 `npm run lint`、`npm run build`、`npm run test:unit`、`npx playwright test`。
10. 更新 `README.md`、`AGENTS.md` 与 `evidence.ts` 快照；提交独立分支，不建 PR（PR 属节点 6）。

---

# 8. 验收映射

| AC | 主要模块 | 单测 | E2E |
| --- | --- | --- | --- |
| AC-01 | `model.ts`、`BoardColumns`、`BoardView` | UT-SEED-01/02 | E2E-AC-01 |
| AC-02 | `ItemFormDialog`、`useBoard` | UT-VALID-01..03 | E2E-AC-02 |
| AC-03 | `rules.ts`、`ItemFormDialog` | UT-VALID-04..12 | E2E-AC-03 |
| AC-04 | `query.ts`、`BoardView` | UT-FILTER-01..08 | E2E-AC-04 |
| AC-05 | `rules.ts`、`ItemDetail` | UT-SM-01..12 | E2E-AC-05 |
| AC-06 | `storage.ts`、`useBoard`、`BoardView` | UT-STORAGE-01..12 | E2E-AC-06a/b/c |
| AC-07 | `query.ts`、`BoardView`、`BoardColumns` | UT-STATS-01..06 | E2E-AC-07 |
| AC-08 | `evidence.ts`、`ItemDetail`、`EvidenceView` | UT-EVID-01..03 | E2E-AC-08 |
| AC-09 | `ResetDialog`、`storage.ts` | UT-STORAGE-10 | E2E-AC-09 |
| AC-10 | 全局渲染/输入 | 静态扫描 | E2E-AC-10 |
| AC-11 | 全局布局/交互 | — | E2E-AC-11 |
| AC-12 | 全流程 | 全量 | 全量 + 过程证据 |

---

# 9. 未覆盖与未知

| 编号 | 项 | 说明 | 后续 |
| --- | --- | --- | --- |
| U-01 | 跨节点 localhost 可达性 | 沙箱网络策略未知 | 节点 4/5 以同一 revision 重现；失败记 BLOCKED |
| U-02 | 平台端口暴露 409 | 无公开预览 URL | 沙箱内预览 + 截图/报告 |
| U-03 | Firefox/Safari 实机 | 本轮仅 Chromium 自动化 | 人工抽检并记录未覆盖 |
| U-04 | 屏幕阅读器 | 仅语义/焦点/键盘自动化 | 人工走查列为未覆盖 |
| U-05 | 多标签页同步 | 明确不做 | 文档记录“最后写入获胜” |
| U-06 | 离线字体 | 既有 Google Fonts | 记录网络噪声，不误判 |
| U-07 | 真实 PR/CI 链接 | 节点 6 才有 | 证据快照届时回填 |
| U-08 | 覆盖率百分比 | 不设全局门槛 | 以用例矩阵覆盖为准 |

---

# 10. 版本

| 项目 | 值 |
| --- | --- |
| Design 版本 | v1.0（revision 1） |
| 生成时间 | 2026-11-27 |
| 关联 Spec | `SDLC-BOARD-SPEC-001` v1.0 |
| 基线 | `main` @ `1f47ad8`；分支 `demo/sam-sdlc-capability` @ `2ca14e0` |
| 原型 | `docs/prototype/requirements-board/` @ `2ca14e0` |
| 测试计划 | `requirements-defect-board.test-plan.md` |
| 需求打标 | `requirements-defect-board.tagging.md` |

## 10.1 变更记录

| 版本 | 日期 | 变更 | 作者 |
| --- | --- | --- | --- |
| v1.0 | 2026-11-27 | 首次技术设计：路由、模块、存储、状态机、证据快照、测试接入 | 产品经理 Agent |
