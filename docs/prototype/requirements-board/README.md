# 研发需求与缺陷看板原型

这是 SDLC 能力演示“需求澄清与原型”节点的静态交互原型，不是最终 React 实现，也不是公开发布。

## 本地预览

```bash
cd docs/prototype/requirements-board
python3 -m http.server 4173 --bind 127.0.0.1
# 浏览器访问 http://127.0.0.1:4173/
```

## 内容

- `index.html` / `styles.css` / `app.js`：看板、表单、筛选、状态机、详情抽屉、持久化与证据页。
- `evidence/PRD.md` / `evidence/PRD.html`：本节点 PRD。
- `evidence/browser-acceptance.json`：浏览器验收检查记录。
- `evidence/*.png`：桌面与窄屏截图。
- `design-notes.md`：设计基线与验收说明。

## 边界

- 仅使用合成数据；示例证据带“示例记录”标签。
- 不调用后端、不访问外部系统、不使用真实凭据。
- 演示复位只重置 `sdlc-demo-board:v1`，不调用 `localStorage.clear()`。
- 下游 Spec、实现、真实 E2E、PR、合并与发布未在本节点执行。
