---
spec_id: SDLC-BOARD-SPEC-001
title: 研发需求与缺陷看板 · 测试计划
status: approved
template_id: 测试计划
schema_version: 1
linked_spec: SDLC-BOARD-SPEC-001
linked_design: SDLC-BOARD-SPEC-001
created_at: 2026-11-27
updated_at: 2026-11-27
revision: 2
---

# 测试计划: 研发需求与缺陷看板

> 本计划定义节点 3-6 如何证明 AC-01..AC-12。测试编号稳定，报告必须引用同一编号。
> 本节点只生成计划，不执行实现测试；不得把“计划通过”写成“已通过”。

---

# 1. 目标与范围

## 1.1 目标

- 每条 AC 至少有一个可执行验证；纯逻辑 AC 同时有单元测试与真实浏览器 E2E。
- 单元测试覆盖校验、筛选、统计、状态机、持久化核心逻辑及异常分支。
- 真实浏览器 E2E 覆盖关键成功路径和失败路径，使用真实 DOM 与真实 localStorage。
- 报告可核对：revision、命令、退出码、执行数、PASS/FAIL/BLOCKED、截图、失败复现、未覆盖项。
- 证明未合并、未发布、未触碰 main 与公开站点。

## 1.2 不在本计划

- 后端接口、数据库、登录、权限、多人协作、外部系统同步测试。
- 生产环境、真实用户/客户数据、公开发布验证。
- 像素级视觉回归、跨浏览器全矩阵、屏幕阅读器人工认证。
- 平台流程/Agent/Skill 配置验证。

## 1.3 基线

| 项目 | 值 |
| --- | --- |
| 仓库 | `samshen29-ops/deliveryai-demo-kz2c6z` |
| 基线 main | `1f47ad864fb9b97835cb8a453e6ed41d132f56e1` |
| 工作分支 | `demo/sam-sdlc-capability` |
| 本节点起点 | `2ca14e0bcfb9e8273e75e31d67db71c0aacc6d7d` |
| 原型验收 | `docs/prototype/requirements-board/evidence/browser-acceptance.json`（14/14 checks PASS，0 console/page error，测试 revision `b10ccbe`） |
| Node/npm | Node v22.21.0 / npm 10.9.4（当前沙箱实测） |
| 浏览器 | Playwright Chromium，`/opt/chromium.org/chromium/chrome`（环境预装，禁止 `playwright install`） |

---

# 2. 测试策略与分层

| 层级 | 工具 | 覆盖 | 执行节点 | 证据 |
| --- | --- | --- | --- | --- |
| 静态检查 | ESLint、TypeScript、`rg` 安全扫描 | 类型、lint、危险 API、敏感信息 | 3 | 终端输出/命令退出码 |
| 单元测试 | Vitest（新增 devDependency） | 种子、校验、筛选、统计、状态机、存储、证据常量 | 3 | Vitest 输出 + JSON 摘要 |
| 构建 | `tsc -b && vite build` | 类型、产物、依赖完整性 | 3 | 退出码 + `dist/` |
| 冒烟 | 沙箱 dev server + curl + 浏览器 | 首屏、静态资源、核心入口 | 4 | URL、HTTP 状态、截图 |
| E2E | Playwright（现有） | AC-01..AC-11 成功/失败路径、键盘、窄屏、console | 3 编写，5 正式执行 | HTML 报告 + 截图 + JSON |
| 过程证据 | Git/PR/平台记录 | AC-12 | 3-6 | commit、PR、review、报告路径 |

原则：

- **先纯函数后 UI**：逻辑缺陷在单测阶段暴露，E2E 只验证集成行为。
- **正反成对**：每个边界至少 1 个接受 + 1 个拒绝用例。
- **同源断言**：统计断言必须同时读取卡片数量、列计数和统计值，不能只断言其中一个。
- **真实存储**：E2E 使用真实 `localStorage`，通过 `addInitScript` 注入损坏/不可用场景，不 mock 应用内部函数。
- **不伪造**：没有执行的测试、没有生成的截图、没有创建的 PR 不得出现在 PASS 列表。

---

# 3. 测试数据与隔离

## 3.1 数据

- 只使用 12 条合成种子与测试中创建的合成工作项。
- 负责人仅使用 `示例产品/示例研发/示例测试/示例设计`。
- XSS 用例使用无害 payload（`window.__xss` 标记），不访问外部网络。
- 不使用真实姓名、邮箱、手机号、token、Cookie、私钥、客户数据。

## 3.2 E2E 隔离

每个用例开始前通过 `page.addInitScript`：

```ts
localStorage.removeItem('sdlc-demo-board:v1')
localStorage.setItem('i18nextLng', 'zh')
localStorage.setItem('elderly-mode', 'false')
localStorage.setItem('unrelated-key', 'keep-me')
```

- 不调用 `localStorage.clear()` 作为应用行为；测试清理也只移除本应用 key，避免掩盖“误清其他 key”的缺陷。
- 损坏用例：`localStorage.setItem('sdlc-demo-board:v1', 'not-json')`。
- 不可用用例：覆盖 `Storage.prototype.setItem/getItem` 抛错（在 `addInitScript` 内），并收集 `pageerror`。
- 每个用例独立、可乱序执行；不依赖上一个用例的数据。

## 3.3 断言定位

优先级：`getByRole`（可访问名）> `getByLabel`/`getByText` > 语义 locator（`article`、`heading`）> CSS。避免依赖易变 DOM 层级；确需 nth 时注释原因。

---

# 4. AC → 测试映射

| AC | 验收点 | 单元测试 | E2E | 其他证据 |
| --- | --- | --- | --- | --- |
| AC-01 | 12 条、5 分组、合成标识、默认入口 | UT-SEED-01/02 | E2E-AC-01 | 截图 `board-desktop.png` |
| AC-02 | 新增/编辑/取消 | UT-VALID-01..03 | E2E-AC-02 | 截图 `create-success.png`、`edit-cancel.png` |
| AC-03 | 空/超长标题、超长描述 | UT-VALID-04..12 | E2E-AC-03 | 截图 `validation-error.png` |
| AC-04 | 关键词/组合筛选/清空/空态 | UT-FILTER-01..08 | E2E-AC-04 | 截图 `filters-empty.png` |
| AC-05 | 合法/非法流转、历史、只读 | UT-SM-01..12 | E2E-AC-05 | 截图 `transition-rejected.png`、`completed-readonly.png` |
| AC-06 | 刷新保留、损坏/不可用 | UT-STORAGE-01..12 | E2E-AC-06a/b/c | 截图 `persist-reload.png`、`storage-corrupt.png`、`storage-unavailable.png` |
| AC-07 | 计数/完成率/空集合 | UT-STATS-01..06 | E2E-AC-07 | 截图 `stats-filtered.png` |
| AC-08 | 详情/证据类型/无 PASS | UT-EVID-01..03 | E2E-AC-08 | 截图 `detail-evidence.png` |
| AC-09 | 复位取消/确认/隔离 | UT-STORAGE-10 | E2E-AC-09 | 截图 `reset-step1.png`、`reset-step2.png` |
| AC-10 | XSS/凭据/身份 | 静态扫描 | E2E-AC-10 | 截图 `xss-safe.png` + `rg` 输出 |
| AC-11 | 键盘/390px/console | — | E2E-AC-11 | 截图 `mobile-board.png`、`mobile-detail.png` |
| AC-12 | 全流程证据 | 全量 | 全量 | commit、报告、PR、review、main 校验 |

---

# 5. 单元测试用例

> 工具：Vitest；命令：`npm run test:unit`；环境：Node（无 jsdom，存储用 fake `StorageLike`）。
> 所有用例必须实际执行；`test.skip`/`test.todo` 不计 PASS。

## 5.1 种子（`model.test.ts`）

| ID | 用例 | 前置/步骤 | 期望 | AC |
| --- | --- | --- | --- | --- |
| UT-SEED-01 | 种子数量与状态分布 | 调用 `createSeedState()` | 12 条；计数 2/3/2/2/3；已完成 3；ID 唯一；完成率 25% | AC-01 |
| UT-SEED-02 | 种子字段与真实性 | 遍历 items | 必填字段齐全；`assignee` 在 4 个示例值内；每条 ≥1 sample 证据、≥1 success 历史；无真实身份模式 | AC-01/AC-10 |

## 5.2 校验（`rules.test.ts`）

| ID | 用例 | 输入 | 期望 | AC |
| --- | --- | --- | --- | --- |
| UT-VALID-01 | 合法草稿与 trim | `title='  合法标题  '` | 无错误；`normalizeDraft` 后为 `合法标题` | AC-02 |
| UT-VALID-02 | 新 ID | items 最大 `DEMO-112` | `DEMO-113`；非 DEMO 项不影响；无 DEMO 项时 `DEMO-101` | AC-02 |
| UT-VALID-03 | 枚举非法 | type/priority/assignee 非法 | 对应字段错误；不返回合法草稿 | AC-02 |
| UT-VALID-04 | 空标题 | `''` | `标题不能为空。` | AC-03 |
| UT-VALID-05 | 纯空格标题 | `'   '` | 同空标题 | AC-03 |
| UT-VALID-06 | 80 标题 | 80 个汉字 | 无错误 | AC-03 |
| UT-VALID-07 | 81 标题 | 81 个汉字 | 错误含 `81` 与 `80` | AC-03 |
| UT-VALID-08 | emoji 码点 | 80 个 `😀` / 81 个 `😀` | 80 接受；81 拒绝；不按 UTF-16 计 160 | AC-03 |
| UT-VALID-09 | 描述 2000 | 2000 字符 | 无错误 | AC-03 |
| UT-VALID-10 | 描述 2001 | 2001 字符 | 错误含 `2001` 与 `2000` | AC-03 |
| UT-VALID-11 | 验收 2001 | 2001 字符 | 错误含 `2001` 与 `2000` | AC-03 |
| UT-VALID-12 | 多错误与修正 | 空标题 + 超长描述 + 非法枚举 | 同时返回多个字段错误；修正后对应错误消失 | AC-03 |

## 5.3 筛选（`query.test.ts`）

| ID | 用例 | 输入 | 期望 | AC |
| --- | --- | --- | --- | --- |
| UT-FILTER-01 | 无筛选 | `EMPTY_FILTERS` | 返回全部 12 条；`hasActiveFilters=false` | AC-04 |
| UT-FILTER-02 | 标题子串 | `q='筛选'` | 命中标题含“筛选”的项 | AC-04 |
| UT-FILTER-03 | 描述子串 | `q='验收清单'`（仅描述） | 命中描述含关键词的项 | AC-04 |
| UT-FILTER-04 | 拉丁大小写 | `q='FILTER'` vs `filter` | 结果一致；大小写不敏感 | AC-04 |
| UT-FILTER-05 | 中文子串 | `q='状态'` | 中文子串命中 | AC-04 |
| UT-FILTER-06 | 类型筛选 | `type='defect'` | 只返回缺陷 | AC-04 |
| UT-FILTER-07 | 组合 AND | type+priority+status+q | 只返回同时满足的项；与逐项交集一致 | AC-04 |
| UT-FILTER-08 | 空白关键词/清空 | `q='   '`；随后 `EMPTY_FILTERS` | 空白视为无关键词；清空恢复 12 条；不修改 items | AC-04 |

## 5.4 统计（`query.test.ts`）

| ID | 用例 | 输入 | 期望 | AC |
| --- | --- | --- | --- | --- |
| UT-STATS-01 | 种子统计 | 12 条种子 | total=12；2/3/2/2/3；completed=3；rate=25 | AC-07 |
| UT-STATS-02 | 空集合 | `[]` | total=0；各状态 0；rate=null；无 NaN/Infinity | AC-07 |
| UT-STATS-03 | 取整 | 1 完成/3 总数 | rate=33 | AC-07 |
| UT-STATS-04 | 全部完成 | 3/3 | rate=100 | AC-07 |
| UT-STATS-05 | 无完成 | 0/3 | rate=0 | AC-07 |
| UT-STATS-06 | 同源一致性 | 任一筛选集合 | `sum(counts)=total`；分列长度=对应 counts | AC-07 |

## 5.5 状态机（`rules.test.ts`）

| ID | 用例 | 输入 | 期望 | AC |
| --- | --- | --- | --- | --- |
| UT-SM-01 | 允许矩阵 | 5×5 全组合 | 仅 6 个允许：待规划→进行中；进行中→审核中/阻塞中；阻塞中→进行中；审核中→已完成/进行中 | AC-05 |
| UT-SM-02 | 合法流转 | 待规划→进行中 | ok；status 更新；updatedAt 更新；success 事件；reason 非空 | AC-05 |
| UT-SM-03 | 跨级拒绝 | 待规划→已完成 | !ok；status 不变；rejected 事件；reason 含当前/目标/允许目标 | AC-05 |
| UT-SM-04 | 完成只读 | 已完成→任意 | !ok；status 不变；reason 含“只读/不会自动重开”；写历史 | AC-05 |
| UT-SM-05 | 自流转 | 进行中→进行中 | !ok；写 rejected 历史 | AC-05 |
| UT-SM-06 | 历史顺序 | 连续两次流转 | 新事件在数组头部；时间倒序展示 | AC-05 |
| UT-SM-07 | 不可变 | 调用前后原对象 | 原 item 不被修改；返回新对象 | AC-05 |
| UT-SM-08 | 历史累积 | 多次合法/非法 | 历史条数递增；成功/拒绝均保留 | AC-05 |
| UT-SM-09 | 阻塞中拒绝 | 阻塞中→审核中 | !ok；reason 允许目标仅“进行中” | AC-05 |
| UT-SM-10 | 拒绝更新时间 | 非法流转 | updatedAt 更新；status 不变 | AC-05 |
| UT-SM-11 | 事件 ID | 连续流转 | 每个事件 ID 唯一 | AC-05 |
| UT-SM-12 | 全矩阵穷尽 | 5×5 参数化 | 25 个组合结果与 Spec §6.2 表完全一致 | AC-05 |

## 5.6 存储（`storage.test.ts`）

| ID | 用例 | 前置/步骤 | 期望 | AC |
| --- | --- | --- | --- | --- |
| UT-STORAGE-01 | 无 key | fake storage 为空 | mode=`empty`；12 条种子；raw=null | AC-06 |
| UT-STORAGE-02 | 合法往返 | save 后 load | mode=`ok`；items/状态/历史/证据一致 | AC-06 |
| UT-STORAGE-03 | 非 JSON | `not-json` | mode=`corrupt`；raw 原样；种子；保存被阻断；显式覆盖后成功 | AC-06 |
| UT-STORAGE-04 | 版本不匹配 | `version: 2` | corrupt；raw 保留 | AC-06 |
| UT-STORAGE-05 | items 非数组 | `items: {}` | corrupt；raw 保留 | AC-06 |
| UT-STORAGE-06 | 缺字段 | 缺 `title` | corrupt；raw 保留 | AC-06 |
| UT-STORAGE-07 | 枚举非法 | `status: '未知'` | corrupt；raw 保留 | AC-06 |
| UT-STORAGE-08 | 重复 ID | 两个 `DEMO-101` | corrupt；不静默去重 | AC-06 |
| UT-STORAGE-09 | 未知字段 | 顶层/工作项含 `x-extra` | 加载成功；保存后字段仍在 | AC-06 |
| UT-STORAGE-10 | 复位隔离 | fake storage 含其他 key | 仅 `sdlc-demo-board:v1` 变为 12 条种子；其他 key 原值不变 | AC-09 |
| UT-STORAGE-11 | 读取抛错 | `getItem` 抛错 | mode=`unavailable`；种子；不抛未处理错误 | AC-06 |
| UT-STORAGE-12 | 写入抛错/重试 | `setItem` 抛错后恢复 | mode=`write-error`；内存态保留；重试成功 | AC-06 |

## 5.7 证据常量（`model.test.ts`）

| ID | 用例 | 期望 | AC |
| --- | --- | --- | --- |
| UT-EVID-01 | 7 节点状态 | 节点 1=`已通过`；节点 2=`已生成 · 待评审`；节点 3-6=`未执行/未创建`；节点 7=`待确认` | AC-08 |
| UT-EVID-02 | 无伪造 | `pending` 项状态不含 `PASS/成功/已合并`；无 `github.com/.../pull/` 虚构链接 | AC-08 |
| UT-EVID-03 | 标签与路径 | `sample` 仅示例；`real` 均有仓库相对路径；`pending` 均有未执行说明 | AC-08 |

---

# 6. E2E 用例

> 工具：Playwright（现有配置）；命令见 §8；每个用例独立，使用 §3.2 隔离。
> 视口默认 1280×720；窄屏用例显式 `setViewportSize({width:390,height:844})`。

## 6.1 主流程

| ID | 用例 | 步骤 | 期望 | AC |
| --- | --- | --- | --- | --- |
| E2E-AC-01 | 首屏种子 | `goto('/')` | URL `#/board`；12 张卡片；5 列；列计数 2/3/2/2/3；合成数据条可见；完成率 25% | AC-01 |
| E2E-AC-02 | 新增/编辑/取消 | 打开新增→填合法标题→保存；打开详情→编辑标题→保存；再次编辑→取消；再次新增→取消 | 新增后 13 张；详情标题更新；取消后标题不变、数量不变；刷新后新增/编辑仍在 | AC-02 |
| E2E-AC-03 | 校验失败 | 空标题提交；81 字标题提交；2001 字描述提交 | 字段错误可见；标题/描述输入保留；焦点在首个错误；修正后可保存 | AC-03 |
| E2E-AC-04 | 搜索/组合/清空/空态 | 搜索“筛选”；类型=缺陷+状态=已完成；点击清空；构造 0 结果 | 搜索 4 张；组合 1 张；清空恢复 12 张；0 结果显示空态与清空入口 | AC-04 |
| E2E-AC-05 | 流转成功/拒绝/只读 | 打开 DEMO-103；选“已完成”提交；选“审核中”提交；打开 DEMO-110 | 第一次拒绝+拒绝历史+状态仍进行中；第二次成功+成功历史+列变化；已完成无编辑/流转、显示只读 | AC-05 |
| E2E-AC-07 | 统计同源 | 对搜索/组合/已完成/空集合分别读取统计与卡片 | total/各状态/列计数=卡片数；完成率正确；空集合显示“无数据”，无 NaN | AC-07 |
| E2E-AC-08 | 详情证据 | 打开种子详情；查看证据区与能力证据页 | 示例记录≥2；真实产物区存在；未执行项存在；无 PASS、无虚构 PR 链接 | AC-08 |

## 6.2 持久化与异常

| ID | 用例 | 步骤 | 期望 | AC |
| --- | --- | --- | --- | --- |
| E2E-AC-06a | 刷新保留 | 新增→编辑→合法流转→`reload()` | 新增项、编辑标题、新状态、历史均保留 | AC-06 |
| E2E-AC-06b | 损坏数据 | 预置 `not-json`；打开；检查 raw；点击“用当前数据覆盖” | 警告可见；导出按钮可见；覆盖前 raw 仍为 `not-json`；覆盖后为合法 version 1 且 12 条 | AC-06 |
| E2E-AC-06c | 存储不可用 | 覆盖 `Storage.prototype.setItem/getItem` 抛错；打开；新增 | 警告“仅在本次页面保留”；新增在内存生效；刷新回种子；无 pageerror | AC-06 |
| E2E-AC-09 | 复位 | 先修改数据；打开复位→取消；再次打开→继续→取消；再次→确认 | 两次取消均无变化；确认后 12 条种子、筛选清空；`i18nextLng`/`elderly-mode`/`unrelated-key` 保留 | AC-09 |

## 6.3 安全、键盘与响应式

| ID | 用例 | 步骤 | 期望 | AC |
| --- | --- | --- | --- | --- |
| E2E-AC-10 | XSS/文本安全 | 新增标题 `<img src=x onerror="window.__xss=1">`、描述 `<script>window.__xss=2</script>`；保存并打开详情 | 文本原样可见；无 `img` 元素；`window.__xss === undefined`；无 console error | AC-10 |
| E2E-AC-11a | 键盘闭环 | 仅用键盘：Tab 到新增→Enter→输入→Tab 保存→Tab 搜索→输入→Tab 打开卡片→Enter→Tab 流转→Enter→Esc | 全流程可完成；焦点可见；Esc 关闭并返回触发元素 | AC-11 |
| E2E-AC-11b | 390px | `setViewportSize(390,844)`；打开看板与详情 | `document.documentElement.scrollWidth <= innerWidth + 1`；列容器可横向滚动；详情/表单不超宽；核心按钮可点 | AC-11 |
| E2E-AC-11c | Console | 执行核心操作，收集 `console.error`/`pageerror` | 本次引入的 error 为 0；环境噪声单独记录 | AC-11 |

## 6.4 路由回归

| ID | 用例 | 步骤 | 期望 | AC |
| --- | --- | --- | --- | --- |
| E2E-ROUTE-01 | 根地址 | `goto('/')` | `#/board` + 看板可见 | AC-01/REQ-013 |
| E2E-ROUTE-02 | 火锅入口 | `goto('/#/home')` | 火锅首页可见，A08 可绑定 | REQ-013 |
| E2E-ROUTE-03 | 深链接 | `goto('/#/menu')` | 自动绑定桌台，菜单可见 | REQ-013 |
| E2E-ROUTE-04 | 非法 hash | `goto('/#/not-a-view')` | 回落 `#/board` | REQ-013 |
| E2E-ROUTE-05 | 既有回归 | 运行既有 `super-spicy.spec.ts`、`view-routing.spec.ts` | 仅导航 helper/入口断言调整；业务断言全部通过 | AC-12 |

---

# 7. 静态与安全检查

| 检查 | 命令 | 期望 | 失败处理 |
| --- | --- | --- | --- |
| Lint | `npm run lint` | exit 0，0 warning | 修复后重跑 |
| 类型/构建 | `npm run build` | exit 0，生成 `dist/` | 修复类型/构建错误 |
| 危险 API | `rg -n "dangerouslySetInnerHTML\|innerHTML\|eval\(" src` | 0 命中（或仅注释且说明） | 改为纯文本渲染 |
| 敏感信息 | `rg -n "(ghp_\|github_pat_\|AKIA\|BEGIN [A-Z ]*PRIVATE KEY\|password\s*=\|secret\s*=)" src docs/spec` | 0 命中 | 删除/脱敏并报告 |
| 身份/客户数据 | `rg -n "示例产品\|示例研发\|示例测试\|示例设计" src/board` | 仅示例名称 | 替换为示例值 |
| Diff 卫生 | `git diff --check` | 无空白错误 | 修正 |
| 变更范围 | `git diff --stat main...HEAD` | 仅本需求文件 | 拆分无关变更 |

> `rg` 的敏感信息扫描只是辅助，不替代人工 review；命中测试用无害字符串时必须注明。

---

# 8. 执行命令与顺序

## 8.1 节点 3（开发与自测）

```bash
# 1. 安装依赖（首次或 lockfile 变化后）
npm ci

# 2. 静态检查
npm run lint

# 3. 单元测试（节点 3 新增脚本）
npm run test:unit

# 4. 构建/类型
npm run build

# 5. 新增 E2E 与既有回归（单次命令，避免重复启动）
PLAYWRIGHT_CHROMIUM_PATH=/opt/chromium.org/chromium/chrome npx playwright test e2e/board.spec.ts e2e/view-routing.spec.ts e2e/super-spicy.spec.ts
```

## 8.2 节点 4（沙箱预览与冒烟）

```bash
npm run dev -- --port 4174 --strictPort
curl -fsSI http://127.0.0.1:4174/ | head -5
curl -fsS http://127.0.0.1:4174/ | head -20
```

- 用浏览器工具访问 `http://127.0.0.1:4174/#/board`，确认首屏、静态资源、无白屏。
- 若平台端口暴露返回 409：记录“无公开 URL”，使用沙箱内地址与截图；不得拼接或声称公开预览。

## 8.3 节点 5（真实 E2E）

```bash
git rev-parse HEAD
git status --porcelain
PLAYWRIGHT_CHROMIUM_PATH=/opt/chromium.org/chromium/chrome npx playwright test
```

- 必须记录 revision、命令、退出码、实际执行数。
- 报告默认输出 `playwright-report/`；截图在 `test-results/`；选取关键截图复制到 `docs/evidence/board/<revision>/`。
- 若跨节点无法访问 localhost：在同一 revision 的测试沙箱重现应用；不得改测旧 Pages/main；失败记 BLOCKED。

## 8.4 禁止

- 禁止 `npx playwright install chromium`（浏览器已预装）。
- 禁止在命令行覆盖 `--reporter`/`--viewport` 等默认配置；窄屏用 `setViewportSize`。
- 禁止用 `sleep`/`waitForTimeout` 代替自动等待。
- 禁止删除失败用例或改断言以“通过”。

---

# 9. 报告格式与证据

## 9.1 机器可读摘要

每个测试轮次生成 `docs/evidence/board/<revision>/test-report.json`：

```json
{
  "title": "研发需求与缺陷看板测试报告",
  "generated_at": "2026-11-27T00:00:00.000Z",
  "revision": "<git rev-parse HEAD>",
  "base_revision": "1f47ad864fb9b97835cb8a453e6ed41d132f56e1",
  "branch": "demo/sam-sdlc-capability",
  "worktree_clean": true,
  "commands": [
    { "command": "npm run test:unit", "exit_code": 0, "duration_ms": 0 },
    { "command": "npx playwright test", "exit_code": 0, "duration_ms": 0 }
  ],
  "summary": { "total": 0, "passed": 0, "failed": 0, "skipped": 0, "blocked": 0 },
  "ac": [
    { "id": "AC-01", "status": "PASS", "tests": ["UT-SEED-01", "E2E-AC-01"], "evidence": ["board-desktop.png"] }
  ],
  "failures": [],
  "uncovered": []
}
```

约束：

- `revision` 必须是实际执行代码的 commit；工作区有未提交改动时 `worktree_clean=false`，不得把该轮当作最终证据。
- `summary.total` 必须等于实际执行数；0 测试不得记 PASS。
- `status` 只能是 `PASS/FAIL/BLOCKED/NOT_RUN`；未执行用 `NOT_RUN`，不得省略。
- 每个 AC 必须出现在 `ac` 数组；没有测试的 AC 标 `NOT_RUN` 并写入 `uncovered`。

## 9.2 人类可读证据

| 证据 | 路径/形式 | 说明 |
| --- | --- | --- |
| Vitest 输出 | 终端 + `test-report.json` | 执行数、通过/失败、失败堆栈 |
| Playwright HTML | `playwright-report/index.html` | 人工复核；不作为 PASS 唯一依据 |
| 截图 | `docs/evidence/board/<revision>/*.png` | 桌面/窄屏/校验/筛选/详情/存储/复位/XSS |
| E2E JSON | `test-report.json` | AC 映射、失败复现、未覆盖 |
| 构建日志 | 终端/摘要 | 命令、退出码、产物路径 |
| Git/PR | commit、PR URL | AC-12；PR 必须 open/unmerged |
| main 未变 | `git rev-parse origin/main` 对比基线 | AC-12 |
| Pages 未变 | 检查 workflow 仅 main 触发；不改站点 | AC-12 |

## 9.3 失败复现

失败时必须记录：

1. 失败用例 ID、AC、预期/实际。
2. 复现命令与 revision。
3. 截图/trace 路径。
4. 是否为环境问题（浏览器路径、端口、网络、字体）。
5. 下一步：修复、重跑、或标 BLOCKED；不得静默跳过。

---

# 10. PASS / FAIL / BLOCKED 判定

## 10.1 PASS

同时满足：

- 命令退出码 0。
- 实际执行数 > 0；`failed=0`；`skipped=0`；无超时。
- 每个 AC 至少有一个对应测试通过；AC-12 的过程证据齐全。
- revision 与 HEAD 一致，工作区干净（或明确记录非最终轮）。
- UI AC 有对应截图；统计 AC 有同源断言。
- 无本次引入的 console error / pageerror。

## 10.2 FAIL

任一：

- 断言失败、退出码非 0、超时、页面崩溃。
- 测试通过但证据缺失（截图/报告/AC 映射）。
- 发现伪造 PASS、虚构 PR/日志/截图。
- 破坏既有火锅演示或既有 E2E。
- 违反授权边界（改 main、合并、发布、真实数据）。

## 10.3 BLOCKED

任一：

- 浏览器/环境缺失且无法用既有路径解决。
- 沙箱 localhost 不可达，且无法在同一 revision 重现。
- 端口/网络策略阻塞，导致无法执行目标测试。
- 依赖安装失败且非代码原因。

BLOCKED 必须记录具体命令、错误、影响和下一步负责人；不得用“跳过”代替。

## 10.4 0 测试/全跳过/超时

- `total=0`：不记 PASS，记 FAIL/BLOCKED（视原因）。
- `skipped=total`：不记 PASS。
- 超时：记 FAIL；保留 trace；修复后重跑，不无限重试。

---

## 10.5 失败处理与停止规则

- 任一依赖步骤失败：停止后续依赖步骤，保留已产生的资源与证据；记录命令、revision、退出码、错误摘要、影响范围。
- 可恢复环境错误（网络抖动、端口占用、浏览器路径、依赖下载）最多修正重试 2 次；每次记录命令与结果。
- 权限、凭据、业务拒绝、协议不兼容或仓库保护规则不得盲目重试；标记 BLOCKED 并报告具体原因。
- 禁止自动跳过失败用例、删除失败证据、覆盖失败报告、无界重试或扩大授权范围。
- 修复后先跑受影响用例，再全量回归；报告只记录实际执行结果，不把计划或推断写成 PASS。
- 失败保留的资源（分支、服务、截图、报告）不得为“干净”而删除；由人工决定后续处理。

## 10.6 PR 与发布边界检查

推送分支或创建 PR 前必须：

1. 检查 Actions 触发器：运行 `rg -n "on:|push:|branches:|workflow_dispatch|deploy-pages|pages" .github/workflows`，确认仅 `main` 触发 Pages；若当前分支/PR 会触发公开部署或创建收费资源，停止并报告，不绕过保护。
2. 确认 `origin/main` 仍为基线 `1f47ad8...`，`git status --porcelain` 干净，`git diff --stat main...HEAD` 只含本需求文件。
3. PR 的 base 为 `main`，head 为 `demo/sam-sdlc-capability`；保持 open/unmerged，不启用 auto-merge。
4. 不合并、不发布、不更新 GitHub Pages、不修改空间默认流程/Agent/权限/集成。

PR 正文必须包含：

1. 关联需求、PRD、Spec、Design、Test Plan 的链接或路径。
2. 变更摘要、范围与非目标。
3. AC-01..AC-12 证据表：测试 ID、命令、退出码、实际执行数、报告/截图路径、状态。
4. 实际 revision、分支、单元/E2E 执行数与构建结果。
5. 风险、未覆盖项、回滚建议。
6. 授权边界声明：未合并、未发布、`main` 与公开站点未变。
7. 人工发布决策待办：不代用户审批，不设置超时自动决策。

PR 正文模板：

```md
## 关联
- 需求：SDLC 能力演示｜研发需求与缺陷看板
- Spec：docs/spec/requirements-defect-board.spec.md
- Design：docs/spec/requirements-defect-board.design.md
- Test Plan：docs/spec/requirements-defect-board.test-plan.md

## 变更
- ...

## 验收证据
| AC | 测试 | 命令 | 退出码 | 结果 | 证据 |
| --- | --- | --- | --- | --- | --- |
| AC-01 | UT-SEED-01/02、E2E-AC-01 | ... | 0 | PASS | ... |

## 风险与未覆盖
- ...

## 回滚
- 回退本分支提交或关闭 PR；不触碰 main；演示数据可用复位恢复。

## 边界
- open / unmerged；未启用 auto-merge；未发布；main 与 GitHub Pages 未变。
- 发布决策待人工确认。
```


# 11. 节点准入与准出

| 节点 | 准入 | 准出 | 不满足时 |
| --- | --- | --- | --- |
| 3 开发、自测与用例 | Spec/Design/Test Plan 已评审；分支可写 | 单测/ lint / build 通过；E2E 用例已编写；实现提交 | 记录失败，不进入 4 |
| 4 沙箱预览与冒烟 | 节点 3 通过 | 沙箱首屏可用；核心入口可操作；截图/URL 记录 | 端口 409 记限制，不声称公开 |
| 5 真实 E2E 与证据 | 节点 4 通过 | 全量 E2E 通过；报告/截图/AC 映射齐全 | 失败/阻塞记录，不进入 6 |
| 6 代码评审与 PR | 节点 5 通过 | 代码审查完成；PR open/unmerged；正文关联需求与证据 | 不合并、不 auto-merge |
| 7 人工发布决策 | 节点 6 完成 | 用户决策 | 不代审批、不超时自动决策 |

---

# 12. 未覆盖与风险

| 项 | 说明 | 处理 |
| --- | --- | --- |
| 跨浏览器全矩阵 | 仅 Chromium 自动化 | Firefox/Safari 人工抽检，记录未覆盖 |
| 屏幕阅读器 | 无 NVDA/VoiceOver 自动化 | 语义/焦点/键盘自动化 + 人工走查 |
| 多标签页并发 | 明确不支持 | 文档记录“最后写入获胜” |
| 生产/发布 | 未授权 | 不测试、不发布 |
| 真实 PR/CI | 节点 6 才有 | 届时补证据，不预填 |
| 端口暴露 409 | 平台限制 | 沙箱内预览；不称公开发布 |
| 字体外链失败 | 既有 Google Fonts | 记录网络噪声，不误判 console error |
| 像素级视觉 | 非目标 | 仅结构与关键布局断言 |

---

# 13. 版本

| 项目 | 值 |
| --- | --- |
| 测试计划版本 | v1.0（revision 1） |
| 生成时间 | 2026-11-27 |
| 关联 Spec | `SDLC-BOARD-SPEC-001` v1.0 |
| 关联 Design | `requirements-defect-board.design.md` v1.0 |
| 基线 | `main` @ `1f47ad8`；分支 `demo/sam-sdlc-capability` @ `2ca14e0` |
| 本轮状态 | 计划已生成并获评审通过；未执行任何实现测试；AC-12 仍为部分覆盖 |

## 13.2 评审记录

| 日期 | 结论 | 说明 |
| --- | --- | --- |
| 2026-11-27 | 确认通过 | 按本计划执行节点 3-6；使用 Vitest + Playwright；真实证据、失败与未覆盖项如实记录；所有实际节点使用 `ark1` |


## 13.1 变更记录

| 版本 | 日期 | 变更 | 作者 |
| --- | --- | --- | --- |
| v1.0 | 2026-11-27 | 首次测试计划：AC 映射、单测/E2E 用例、命令、报告格式、PASS 判定 | 产品经理 Agent |
| v1.1 | 2026-11-27 | 记录用户评审通过；确认测试口径与下游执行约束 | 产品经理 Agent |
