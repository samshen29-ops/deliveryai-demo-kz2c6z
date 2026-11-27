# 原型设计说明与浏览器验收证据

## 1. 来源与基线

- 需求: SDLC 能力演示｜研发需求与缺陷看板（节点：需求澄清与原型）。
- 仓库: `samshen29-ops/deliveryai-demo-kz2c6z`。
- 基线 revision: `1f47ad864fb9b97835cb8a453e6ed41d132f56e1`（main）。
- 分支: `demo/sam-sdlc-capability`。
- 测试 revision: `e19e7d6b0f7d8ecd0201cdabb193078b026902ce`（本节点首个提交）。
- 设计系统: 产品空间 `knowledge/design-system/` 为空，未同步设计系统；采用仓库 `tailwind.config.js` 的 rice/chili/amber/charcoal 色板、Inter/Noto Sans SC 字体栈、圆角/阴影与 `src/components/ui/` 的按钮/弹层模式。
- 原型形态: 独立静态 HTML/CSS/JS 包，用于行为与视觉评审；不是最终 React 实现。
- 预览方式: 沙箱内 detached `python3 -m http.server 4173 --bind 127.0.0.1`；浏览器工具访问 `http://127.0.0.1:4173/`。`agentnative sandbox port expose` 返回 409（平台不支持端口暴露），因此没有公开 URL，也没有公开发布。

## 2. 保留与变更

- 保留: 仓库暖色纸感背景、chili 主色、charcoal 深色、amber 强调、圆角卡片、清晰焦点环与中文文案风格。
- 变更: 业务从火锅点单转为研发看板；新增 5 列状态泳道、统计、搜索筛选、工作项表单、详情抽屉、状态机、localStorage 降级、演示复位、能力证据与演示指南。
- 不引入: 后端、数据库、登录、权限、外部系统、真实数据、外部字体/图片/脚本。

## 3. 页面与交互

- 看板主页: 桌面 5 列同屏；窄屏看板横向滚动，页面本身不横向溢出。
- 新增/编辑: 类型、标题、描述、优先级、示例负责人、验收说明；标题去空格后 1-80，描述/验收最多 2000；错误定位并保留输入。
- 筛选: 标题/描述关键词 + 类型/优先级/状态 AND；一键清空；空态解释。
- 状态机: 待规划→进行中；进行中→审核中/阻塞中；阻塞中→进行中；审核中→已完成/进行中；已完成只读。非法流转写入拒绝历史。
- 详情: 业务说明、验收清单、状态历史、证据清单；证据区分“示例记录”“本轮真实产物”“未执行/待确认”。
- 持久化: key `sdlc-demo-board:v1`；损坏时保留原始内容，提供导出与显式覆盖；不可用时内存态。
- 复位: 两步确认；只重置本应用 key；不调用 `localStorage.clear()`。
- 能力证据: 7 个节点；本节点已生成/已执行，下游未执行/待创建/待确认；不出现伪造 PASS。

## 4. 浏览器验收

- 命令: `node .agentnative/design/sdlc-requirements-board/acceptance.js`
- 退出码: 0
- 结果: 14/14 checks PASS；0 console/page error。
- 报告记录: tested_revision=`e19e7d6b0f7d8ecd0201cdabb193078b026902ce`，base_revision=`1f47ad864fb9b97835cb8a453e6ed41d132f56e1`。
- 视口: 1440×1000、390×844。
- 检查覆盖:
  - AC-01 12 条种子、5 列、合成标识、统计 2/3/2/2/3、完成率 25%。
  - AC-02 新增、编辑、取消、编辑取消、标题去空格。
  - AC-03 空标题、81 字符标题、2001 字符描述；输入保留。
  - AC-04 关键词、类型/优先级/状态组合、清空、空态。
  - AC-05 合法流转、非法跨级拒绝、拒绝历史、已完成只读。
  - AC-06 刷新保留新增/编辑/流转；损坏保留原始内容；不可用内存态。
  - AC-07 筛选集合统计与卡片一致；空集合“无数据”。
  - AC-08 示例/真实/未执行证据区分；无 PASS。
  - AC-09 复位取消/确认；其他 localStorage key 保留。
  - AC-10 HTML/脚本按文本显示；`window.__xss` 未定义；无凭据模式。
  - AC-11 键盘打开/关闭、390px 无页面横向溢出、抽屉/表单不超宽、焦点返回。
- 报告: `evidence/browser-acceptance.json`。
- 截图:
  - `evidence/desktop-board.png`
  - `evidence/validation-error.png`
  - `evidence/filters-empty.png`
  - `evidence/detail-drawer.png`
  - `evidence/storage-recovery.png`
  - `evidence/reset-confirm.png`
  - `evidence/xss-safe.png`
  - `evidence/mobile-board.png`
  - `evidence/mobile-detail.png`
  - `evidence/mobile-form.png`

## 5. 用户评审结果

- 日期: 2026-11-27
- 结论: 通过，进入产品与技术 Spec。
- 修改意见: 无。
- 实现入口建议: 保留火锅演示，新增默认看板入口。
- AC-12: 保持部分覆盖，不标记为通过。

## 6. 已知限制

- 端口暴露 409，无公开预览 URL；预览仅限沙箱内。
- 静态原型不是最终 React 实现；真实单元测试、构建、正式冒烟、真实 E2E、PR、合并与发布未执行。
- 截图是全页截图，固定抽屉/弹层在截图中按视口渲染；交互结论以 `browser-acceptance.json` 的检查记录为准。
