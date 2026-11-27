# 研发需求与缺陷看板 · 节点 5「真实 E2E 与证据」报告

> 生成时间：2026-11-27T10:11:24Z ｜ 结论：**PASS_WITH_CONDITION（E2E 全通过，AC-12 待节点 6）**

## 1. Revision 与环境

| 项目 | 值 |
| --- | --- |
| 仓库 | `samshen29-ops/deliveryai-demo-kz2c6z` |
| 测试 revision | `01278e651d0882ea60c92f70fc0dca9fcc230762`（detached worktree，测试前后工作区干净） |
| 工作分支 | `demo/sam-sdlc-capability` |
| 基线 main | `1f47ad864fb9b97835cb8a453e6ed41d132f56e1`（未修改） |
| OS | Linux 6.6.95.bck.4-rc5-amd64 x86_64 |
| Node | v22.21.0 |
| npm | 10.9.4 |
| Playwright | 1.62.1 |
| Chromium | Chromium 135.0.7049.78 (/opt/chromium.org/chromium/chrome) |
| 视口 | Desktop Chrome 1280x720；窄屏用例 390x844 |
| 并发 | 1 |
| 重试 | 0 |
| WebServer | npm run dev -- --port 5173 --strictPort |

> E2E 在测试沙箱内按上游记录的同一 revision 检出并启动应用，未改测 main 或旧公开站点。

## 2. 执行命令与结果

| 命令 | 退出码 | 结果 | 实际执行 |
| --- | --- | --- | --- |
| `npm ci` | 0 | PASS | 316 packages |
| `npm run lint` | 0 | PASS | 0 error / 0 warning |
| `npm run test:unit` | 0 | PASS | 47 总数 / 47 通过 / 0 失败 / 0 跳过 |
| `npm run build` | 0 | PASS | tsc -b && vite build；dist/ 产物生成 |
| `npx playwright test e2e/board.spec.ts e2e/view-routing.spec.ts e2e/super-spicy.spec.ts` | 0 | PASS | 33 总数 / 33 通过 / 0 失败 / 0 跳过 |

- 首次执行与退出码捕获重跑均为 33/33 通过；下表为最终一次（exit 0）的逐用例结果，无重试、无跳过、无超时。
- 终端原始输出：[`playwright-output.txt`](playwright-output.txt)；lint/unit/build 日志同目录。
- Playwright HTML 报告：随工作流产物 bundle 上传的 `playwright-report/index.html`（8.0 MB，含全部附件），未提交进 Git。

## 3. 逐用例结果

| # | 状态 | 用例 | 耗时(s) |
| --- | --- | --- | --- |
| 1 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-01: 首屏 12 条合成数据、5 列、合成标识与 25% 完成率 | 6.2 |
| 2 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-02: 新增合法、编辑保存、取消编辑与取消新增均无副作用 | 7.2 |
| 3 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-03: 空白/超长标题与超长描述被拒绝，错误定位且输入保留 | 4.4 |
| 4 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-04: 关键词、组合筛选、清空与零结果空态 | 2.3 |
| 5 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-05: 合法流转、非法拒绝写入历史、已完成只读 | 3.1 |
| 6 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-06a: 新增、编辑、合法流转后刷新仍保留 | 3.9 |
| 7 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-06b: 损坏数据受控提示、raw 保留、显式覆盖后恢复 | 3.5 |
| 8 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-06c: 存储不可用时内存态运行、刷新回种子且无 pageerror | 3.7 |
| 9 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-07: 统计与卡片/列计数同源，空集合无 NaN | 2.0 |
| 10 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-08: 详情证据分级、能力证据 7 节点、真实产物可访问且无 PASS/虚构 PR | 2.7 |
| 11 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-09: 复位两步取消无变化，确认只重置本应用数据 | 3.4 |
| 12 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-10: HTML/脚本输入作为文本显示且不执行 | 2.2 |
| 13 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-11a: 仅用键盘完成新增、搜索、流转与关闭 | 1.7 |
| 14 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-11b: 390px 窄屏无页面级横向溢出，详情与表单可用 | 4.3 |
| 15 | PASS | 研发需求与缺陷看板 E2E › E2E-AC-11c: 核心操作无本次引入的 console error / pageerror | 2.8 |
| 16 | PASS | 超级辣锅底选项 - E2E 验收测试 › REQ-001: 超级辣选项在锅底辣度区域可见 | 2.2 |
| 17 | PASS | 超级辣锅底选项 - E2E 验收测试 › REQ-002: 选择超级辣时弹出风险提示弹窗，弹窗文案正确 | 5.3 |
| 18 | PASS | 超级辣锅底选项 - E2E 验收测试 › REQ-002.3: 选择微辣/中辣/重辣时不弹出风险提示弹窗 | 2.9 |
| 19 | PASS | 超级辣锅底选项 - E2E 验收测试 › REQ-002.4: 每次选择超级辣都弹出风险提示弹窗 | 2.9 |
| 20 | PASS | 超级辣锅底选项 - E2E 验收测试 › REQ-003: 确认后超级辣被选中并可继续下单 | 2.3 |
| 21 | PASS | 超级辣锅底选项 - E2E 验收测试 › REQ-004.1: 点击「重新选择」后超级辣不被选中，恢复之前选择 | 2.3 |
| 22 | PASS | 超级辣锅底选项 - E2E 验收测试 › REQ-004.2: 点击遮罩区域等同取消，恢复原选择状态 | 2.8 |
| 23 | PASS | 超级辣锅底选项 - E2E 验收测试 › REQ-004.4: 此前未选任何辣度时取消，恢复为无辣度选中状态 | 2.1 |
| 24 | PASS | 超级辣锅底选项 - E2E 验收测试 › REQ-005: 现有辣度选项选择和下单流程不受影响 | 4.8 |
| 25 | PASS | 超级辣锅底选项 - E2E 验收测试 › REQ-001: p2 牛油麻辣锅也显示超级辣选项 | 2.3 |
| 26 | PASS | 超级辣锅底选项 - E2E 验收测试 › NFR-001: 点餐页面和下单流程保持正常 | 4.1 |
| 27 | PASS | 视图 URL 路由 - hash 模式 › ROUTE-001: 根地址进入看板 #/board | 3.0 |
| 28 | PASS | 视图 URL 路由 - hash 模式 › ROUTE-002: 主流程各视图拥有独立地址 | 1.8 |
| 29 | PASS | 视图 URL 路由 - hash 模式 › ROUTE-003: 顶栏导航切换地址（menu ↔ order） | 2.9 |
| 30 | PASS | 视图 URL 路由 - hash 模式 › ROUTE-004: 浏览器后退回到上一视图 | 1.7 |
| 31 | PASS | 视图 URL 路由 - hash 模式 › ROUTE-005: 深链接直达 #/menu（自动绑定示例桌台） | 1.1 |
| 32 | PASS | 视图 URL 路由 - hash 模式 › ROUTE-006: 非法地址回落到看板 #/board | 1.2 |
| 33 | PASS | 视图 URL 路由 - hash 模式 › ROUTE-007: #/home 深链接保留火锅首页与返回看板入口 | 1.0 |

分文件：board 15/15、view-routing 7/7、super-spicy（火锅回归）11/11。

## 4. 验收追溯

| AC | 验收点 | 结论 | E2E 用例 | 证据 |
| --- | --- | --- | --- | --- |
| AC-01 | 12 条合成工作项、状态分组与合成数据标识 | **PASS** | `E2E-AC-01` | `screenshots/board-desktop.png` |
| AC-02 | 新增合法、编辑保存、取消无修改 | **PASS** | `E2E-AC-02` | `screenshots/create-success.png`<br>`screenshots/edit-cancel.png` |
| AC-03 | 空白/超长标题与超长描述被拒绝且反馈清晰 | **PASS** | `E2E-AC-03` | `screenshots/validation-error.png` |
| AC-04 | 关键词、类型、优先级、状态组合筛选与清空 | **PASS** | `E2E-AC-04` | `screenshots/filters-empty.png` |
| AC-05 | 合法流转、历史、非法拒绝、已完成只读 | **PASS** | `E2E-AC-05` | `screenshots/transition-rejected.png`<br>`screenshots/completed-readonly.png` |
| AC-06 | 刷新保留、损坏/不可用受控反馈 | **PASS** | `E2E-AC-06a`<br>`E2E-AC-06b`<br>`E2E-AC-06c` | `screenshots/persist-reload.png`<br>`screenshots/storage-corrupt.png`<br>`screenshots/storage-unavailable.png` |
| AC-07 | 计数与卡片一致、完成率正确、零结果无 NaN | **PASS** | `E2E-AC-07` | `screenshots/stats-filtered.png` |
| AC-08 | 详情记录与证据类型正确，示例不冒充真实 | **PASS** | `E2E-AC-08` | `screenshots/detail-evidence.png` |
| AC-09 | 复位取消无变化，确认只重置本 Demo 数据 | **PASS** | `E2E-AC-09` | `screenshots/reset-step1.png`<br>`screenshots/reset-step2.png` |
| AC-10 | HTML/脚本输入安全显示，不执行；无真实凭据/身份/客户数据 | **PASS** | `E2E-AC-10` | `screenshots/xss-safe.png` |
| AC-11 | 核心操作键盘可用、390px 无遮挡、无本次引入 console error | **PASS** | `E2E-AC-11a`<br>`E2E-AC-11b`<br>`E2E-AC-11c` | `screenshots/mobile-board.png`<br>`screenshots/mobile-detail.png` |
| AC-12 | 可核验的 PRD、Spec、commit、单测/构建、预览、E2E 报告、审查与 open/unmerged PR；main 与公开站点未变 | **PARTIAL** | `E2E-AC-01..11c` | `screenshots/playwright-output.txt` |

- **AC-01 PASS**：12 卡片；列计数 2/3/2/2/3；完成率 25%；合成标识可见
- **AC-02 PASS**：新增后 13 条且 ID=DEMO-113；编辑生效；取消编辑/取消新增均无副作用
- **AC-03 PASS**：空标题/81 字标题/2001 字描述均被拒绝；错误定位到字段且输入保留
- **AC-04 PASS**：关键词 4 条；缺陷+已完成 1 条；清空恢复 12 条；零结果空态可解释
- **AC-05 PASS**：进行中→已完成被拒并写入拒绝历史；进行中→审核中成功；已完成无编辑/流转入口
- **AC-06 PASS**：刷新保留新增/编辑/流转；损坏 raw 保留且可显式覆盖；存储不可用降级内存态且无 pageerror
- **AC-07 PASS**：全量/筛选/零结果三种集合统计与卡片、列计数同源；空集显示“无数据”
- **AC-08 PASS**：示例证据标签为“示例记录”；真实产物区可见；详情与证据页均无 PASS/虚构 PR；产物链接 HTTP 200
- **AC-09 PASS**：两步取消均保持 13 条；确认后回 12 条；i18nextLng/elderly-mode/unrelated-key 未变
- **AC-10 PASS**：payload 按文本显示；未生成 img[src=x]；window.__xss 未定义；无 console/pageerror；静态扫描仅命中测试计划自身正则文本
- **AC-11 PASS**：键盘可新增/搜索/清空/流转/Esc 关闭；390px 无页面级横向溢出且列区可滚动；核心操作无 console/pageerror
- **AC-12 PARTIAL**：本轮已补 E2E HTML 报告、截图、真实执行记录；主线/公开站点核验通过；代码审查与 open/unmerged PR 属节点 6，尚未创建

## 5. 其他核验

| 检查 | 结果 | 说明 |
| --- | --- | --- |
| 远程分支 tip（测试前） | PASS | git ls-remote origin demo/sam-sdlc-capability = 01278e651d0882ea60c92f70fc0dca9fcc230762 |
| main 未被修改 | PASS | git ls-remote origin main = 1f47ad864fb9b97835cb8a453e6ed41d132f56e1（与基线一致） |
| 公开 GitHub Pages 未更新 | PASS | 站点标题仍为“沸点 · 火锅点单概念演示”，不含“研发需求与缺陷看板”；deploy-pages 最近 run 为 main@1f47ad8，2026-11-27T06:54:20Z success |
| Actions 触发面 | PASS | .github/workflows/deploy-pages.yml 仅 push main / workflow_dispatch；推送 demo 分支不会触发公开部署 |
| 危险渲染 API 静态扫描 | PASS | rg "dangerouslySetInnerHTML|innerHTML|eval\(" src → 0 命中 |
| 敏感信息静态扫描 | PASS_WITH_NOTE | 仅命中测试计划自身记录的正则文本，无真实凭据 |
| 人工浏览器复核（Playwright 之外） | PASS | 本地 Chromium 打开 #/board：12 卡片、统计 12、完成率 25%；搜索“筛选”后 4 卡片/统计 4/0%；详情证据标签 2 条“示例记录”；能力证据 7 节点；如何演示页可达 |

## 6. 风险

| ID | 等级 | 风险 | 责任方 | 建议 |
| --- | --- | --- | --- | --- |
| R-01 | 中 | 应用内“能力证据/详情真实产物”仍是节点 3 构建期快照：节点 4/5 显示“未执行”，详情显示“真实 E2E 未执行”。这是保守标注而非伪造成功，但与本轮实际执行不一致。 | 节点 6（代码评审与 PR） | 在 src/board/evidence.ts 更新节点 4/5 状态与 E2E 报告入口，AC-01..11 标为已覆盖、AC-12 保持部分，并重跑 E2E |
| R-02 | 中 | 仅 Chromium 自动化；Firefox/Safari 与屏幕阅读器人工走查未覆盖。 | 测试/设计 | 发布前按需补跨浏览器冒烟与可访问性走查 |
| R-03 | 低 | 平台不支持端口暴露（HTTP 409），仅有沙箱内 http://localhost:5173 预览，无公网地址。 | 交付/演示 | 演示在本沙箱进行，不宣称公开发布 |
| R-04 | 低 | 390px 为浏览器模拟，未覆盖真机安全区/软键盘。 | 设计/测试 | 真机抽检可选 |
| R-05 | 低 | 多标签页并发写同一 localStorage key 为最后写入获胜。 | 研发 | 演示避免多标签同时编辑，或后续加 storage 事件同步 |
| R-06 | 低 | 既有 Google Fonts 外链在离线环境可能失败；E2E 已过滤该环境噪声。 | 研发 | 无需本次处理；离线演示可忽略字体回退 |
| R-07 | 低 | pnpm-lock.yaml 未随 Vitest 更新；仓库与 CI 使用 npm/package-lock.json。 | 研发 | 若启用 pnpm 需补齐锁文件 |

## 7. 未覆盖项

- AC-12 的代码审查记录、open/unmerged PR 与人工发布决策（节点 6-7）
- Firefox/Safari、真实移动设备、屏幕阅读器人工认证、像素级视觉回归
- 性能/负载与长时间多标签并发写入
- 公开发布后的 Pages 线上功能验证（本轮明确不发布）

## 8. 结论

本轮在 revision 01278e6 真实浏览器执行 33/33 PASS、0 FAIL、0 SKIP、0 超时；AC-01..AC-11 全部通过并有截图与 HTML 报告；AC-12 中 PRD/Spec/commit/单测/构建/沙箱预览/E2E 证据已具备，代码审查与 open PR 待节点 6，故为部分通过。可进入节点 6，不得视为已发布或已合并。

> 本报告不代表已合并或已公开发布；PR 与人工发布决策属节点 6-7。演示复位不是平台 reset。
