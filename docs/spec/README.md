# 产品与技术 Spec 包

本目录是 SDLC 能力演示“产品与技术 Spec”节点的交付物，面向节点 3 开发/自测与后续评审。

| 文档 | 内容 | 状态 |
| --- | --- | --- |
| [产品 Spec](./requirements-defect-board.spec.md)（[HTML](./requirements-defect-board.spec.html)） | 目标、范围、REQ-001..REQ-013、AC-01..AC-12 判定口径、数据/状态/存储契约、边界与反例 | 已生成 · 待评审 |
| [技术 Design](./requirements-defect-board.design.md)（[HTML](./requirements-defect-board.design.html)） | 路由接入、模块与文件清单、函数签名、存储状态机、证据快照、实施顺序、回滚 | 已生成 · 待评审 |
| [测试计划](./requirements-defect-board.test-plan.md)（[HTML](./requirements-defect-board.test-plan.html)） | AC→单测/E2E 映射、UT-*/E2E-* 用例、命令、报告格式、PASS/FAIL/BLOCKED 判定 | 已生成 · 待评审 |
| [需求打标](./requirements-defect-board.tagging.md)（[HTML](./requirements-defect-board.tagging.html)） | 七维评估、B 类结论、人工决策点、复评条件 | 已生成 · 待评审 |

## 基线

- 仓库：`samshen29-ops/deliveryai-demo-kz2c6z`
- 基线 `main`：`1f47ad864fb9b97835cb8a453e6ed41d132f56e1`
- 工作分支：`demo/sam-sdlc-capability`
- 本节点起点：`2ca14e0bcfb9e8273e75e31d67db71c0aacc6d7d`
- 上游：`docs/prd/requirements-defect-board.md`、`docs/prototype/requirements-board/`（均已评审通过）

## 边界

- 本节点不落地实现代码、不运行实现测试、不创建 PR、不合并、不发布。
- 所有工作项、人员、证据示例均为合成数据；未执行项不得标记为 PASS。
- AC-12 在本节点仍为部分覆盖：实现、单测、构建、沙箱冒烟、真实 E2E、代码审查与 PR 由节点 3-6 完成。
- 评审通过前不进入实现；修改时复用同一文件名并递增 revision。
