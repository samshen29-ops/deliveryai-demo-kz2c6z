# 沸点火锅点单演示 + SDLC 需求与缺陷看板

仓库包含两个演示：默认入口是中文「研发需求与缺陷看板」（SDLC 能力演示），同时保留原有沸点火锅点单与履约流程演示。

> 本项目为概念演示，不代表正式产品。

## 入口

- 看板：`/#/board`（根地址默认进入）
- 火锅演示：`/#/home`

## 看板功能

- 12 条明确标注「演示合成数据」的需求/缺陷种子
- 新增、编辑、校验、关键词搜索与类型/优先级/状态组合筛选
- 状态机流转、非法流转拒绝历史、已完成只读
- 详情侧栏：业务说明、验收清单、状态历史与证据分级
- 总览统计与当前筛选集合同源，空集合显示「无数据」
- 浏览器 localStorage 持久化、损坏/不可用降级、两步演示复位
- 能力证据与「如何演示」入口；未执行项不标记成功

## 火锅演示功能

- 绑定餐桌并进入点餐流程
- 按分类浏览、搜索和选择菜品
- 配置菜品规格、口味及下单人
- 多人协同点餐与购物车管理
- 查看订单制作及上菜进度
- 呼叫加汤、饮料、餐具和结账服务
- 模拟菜品售罄、服务响应及履约状态
- 模拟结账和支付成功流程
- 支持中英文切换和老人模式

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- i18next
- Playwright
- Vitest

## 环境要求

- Node.js 18 或更高版本
- npm 9 或更高版本

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

服务默认运行在 `http://localhost:5173`。如果该端口已被占用，Vite 会自动选择其他可用端口。

## 常用命令

```bash
# 启动开发服务
npm run dev

# 执行代码检查
npm run lint

# 单元测试（Vitest）
npm run test:unit

# 构建生产版本
npm run build

# 端到端测试（Playwright，浏览器路径由环境预装）
PLAYWRIGHT_CHROMIUM_PATH=/opt/chromium.org/chromium/chrome npx playwright test
```

看板数据只写入本应用 key `sdlc-demo-board:v1`；演示复位只重置该 key，不调用 `localStorage.clear()`。

生产构建产物会生成在 `dist/` 目录。

## 项目结构

```text
.
├── docs/                   # PRD、Spec/Design/Test Plan、原型与测试证据
├── e2e/                    # Playwright 端到端测试（board/view-routing/super-spicy）
├── server/                 # 演示服务端
├── src/
│   ├── assets/             # 图片资源
│   ├── board/              # 看板领域逻辑、种子、存储、证据快照与单测
│   ├── components/         # 页面及通用组件（board/ 为看板 UI）
│   ├── data/               # 菜单等演示数据
│   ├── hooks/              # React Hooks
│   ├── state/              # 订单状态管理
│   ├── App.tsx             # 应用入口组件
│   ├── i18n.ts             # 中英文文案
│   └── index.css           # 全局样式
├── index.html
├── tailwind.config.js
└── vite.config.ts
```

## 预览模式

访问以下地址可以直接进入已绑定餐桌并带有购物车数据的菜单预览：

```text
http://localhost:5173/?preview=menu
```

实际端口以 Vite 启动日志为准。
