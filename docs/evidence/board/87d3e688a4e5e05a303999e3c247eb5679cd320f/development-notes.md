# 研发需求与缺陷看板 · 开发说明（节点 3）

## 基线与分支

> 远程分支在本轮开始时已包含前序节点提交（b25035f）；本轮实现以 rebase 叠加在其后，未覆盖上游历史。

| 项目 | 值 |
| --- | --- |
| 仓库 | `samshen29-ops/deliveryai-demo-kz2c6z` |
| 基线 main | `1f47ad864fb9b97835cb8a453e6ed41d132f56e1`（未修改） |
| 工作分支 | `demo/sam-sdlc-capability`（本轮新建，远程原不存在同名分支） |
| 实现提交 | `8490e2042e4c0968d1167f958874487684a7cd46` |
| 最终测试 revision | `87d3e688a4e5e05a303999e3c247eb5679cd320f` |
| 授权边界 | 未合并、未 auto-merge、未发布、未更新 GitHub Pages、未创建收费资源 |

## 实现范围

- 默认入口改为 `#/board`；保留火锅演示 `#/home` 到 `#/checkout`，既有业务代码与 E2E 断言未删除。
- 新增 `src/board/` 纯函数领域层：种子、校验、筛选、统计、状态机、存储适配、证据快照、中文文案。
- 新增 `src/components/board/` UI：看板、列/卡片、详情抽屉、表单、两步复位、能力证据、如何演示。
- 新增 Vitest（唯一新增 devDependency）与 `npm run test:unit`；新增 `e2e/board.spec.ts`。
- 存储 key 固定 `sdlc-demo-board:v1`；损坏时保留 raw 并阻断覆盖，不可用时内存态降级，复位只写本 key。
- 证据页为构建期静态快照：节点 1 已通过、节点 2 已生成·待评审、节点 3 已执行（单测/构建）、节点 4-6 未执行/未创建、节点 7 待确认；不预填 PR 或成功结论。

## 验证结果（revision `87d3e688a4e5e05a303999e3c247eb5679cd320f`，工作区干净）

| 命令 | 退出码 | 实际结果 |
| --- | --- | --- |
| `npm run lint` | 0 | 0 error / 0 warning |
| `npm run test:unit` | 0 | 4 个文件，47/47 通过，0 跳过 |
| `npm run build` | 0 | `tsc -b && vite build` 成功，产物 `dist/` |
| `npx playwright test e2e/board.spec.ts e2e/view-routing.spec.ts e2e/super-spicy.spec.ts` | 0 | 33/33 通过（看板 15、火锅回归 12、路由 6），0 失败/跳过 |

> 上述 E2E 为**节点 3 本地自测**，不替代节点 5 的正式真实 E2E 与 HTML 报告；两者均需在同一 revision 复核。
> 本地 HTML 报告在 `playwright-report/index.html`（gitignored）；本目录提交了关键截图与机器可读报告。

## 静态与安全检查

- `rg -n "dangerouslySetInnerHTML|innerHTML|eval\(" src`：0 命中。
- 敏感信息扫描仅命中测试计划自身记录的正则文本，无真实凭据。
- `git diff --check`：通过。
- Actions 触发器：`.github/workflows/deploy-pages.yml` 仅 `push: branches: [main]` 与 `workflow_dispatch`；推送本分支不会触发公开部署。
- 页面无新增外部请求；证据链接只指向仓库内文件。

## 已知限制与未覆盖

- 沙箱预览/冒烟（节点 4）、正式 E2E（节点 5）、代码审查与 PR（节点 6）、人工发布决策（节点 7）未执行。
- 仅 Chromium 自动化；Firefox/Safari 与屏幕阅读器人工走查未覆盖。
- 多标签页并发写入不支持，最后写入获胜。
- 既有 Google Fonts 外链在离线环境可能失败；E2E 已过滤该环境噪声，未发现本次引入的 console/page error。
- `pnpm-lock.yaml` 未随 Vitest 更新：仓库文档与 CI 使用 npm/`package-lock.json`；`pnpm-workspace.yaml` 缺少 `packages` 字段，pnpm 9 无法生成锁文件。已在风险中记录。

## 回滚建议

- 代码：回退 `demo/sam-sdlc-capability` 上的看板提交或关闭后续 PR；不触碰 `main`。
- 数据：使用页面内两步演示复位恢复 12 条种子；损坏数据先导出再显式覆盖；不调用 `localStorage.clear()`。
- 若默认入口影响火锅演示：将 `createInitialState` 默认值改回 `home`，保留 `#/board` 入口即可最小回滚。

## Rebase 历史说明

本分支在推送前先集成了远程已有的前序节点提交（`b25035f`），因此执行了本地 rebase。过程中曾生成临时 revision `821926c8077b71173d59b881bd74f779c0f99cd8`；该对象未推送、已不在最终分支历史中。最终验证 revision 为 `87d3e688a4e5e05a303999e3c247eb5679cd320f`，`test-report.json` 与本目录截图均对应该 revision。
