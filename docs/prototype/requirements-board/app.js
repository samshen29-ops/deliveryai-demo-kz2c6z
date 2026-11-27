'use strict';

const STORAGE_KEY = 'sdlc-demo-board:v1';
const APP_VERSION = 1;
const STATUS_META = [
  { value: '待规划', key: 'plan', label: '待规划' },
  { value: '进行中', key: 'progress', label: '进行中' },
  { value: '审核中', key: 'review', label: '审核中' },
  { value: '阻塞中', key: 'blocked', label: '阻塞中' },
  { value: '已完成', key: 'done', label: '已完成' },
];
const STATUS_VALUES = STATUS_META.map((item) => item.value);
const TYPE_LABELS = { requirement: '需求', defect: '缺陷' };
const PRIORITIES = ['P0', 'P1', 'P2', 'P3'];
const ASSIGNEES = ['示例产品', '示例研发', '示例测试', '示例设计'];
const TRANSITIONS = {
  待规划: ['进行中'],
  进行中: ['审核中', '阻塞中'],
  阻塞中: ['进行中'],
  审核中: ['已完成', '进行中'],
  已完成: [],
};

const ICONS = {
  board: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  evidence: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9 14 2 2 4-4"/></svg>',
  compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>',
};

const DELIVERY_STATE = {
  browserAcceptance: '已执行',
  browserDetail: '桌面 1440×1000 / 窄屏 390×844；14/14 检查；截图见 evidence/；沙箱端口暴露返回 409，仅 127.0.0.1:4173',
  review: '已通过（2026-11-27）',
};

const CAPABILITY_STAGES = [
  {
    index: '01', name: '需求澄清与原型', status: 'current', statusLabel: '已通过', current: true,
    items: [
      { label: 'PRD Markdown', status: '已生成', tag: 'real', detail: '本轮 PRD 正文', href: 'evidence/PRD.md' },
      { label: 'PRD HTML', status: '已生成', tag: 'real', detail: '静态可读版本', href: 'evidence/PRD.html' },
      { label: '交互原型', status: '已生成', tag: 'real', detail: '本页；含浏览器验收截图' },
      { label: '浏览器验收', status: DELIVERY_STATE.browserAcceptance, tag: 'real', detail: DELIVERY_STATE.browserDetail },
      { label: '用户评审', status: '通过', tag: 'real', detail: '2026-11-27；备注为空；入口建议：保留火锅演示，新增默认看板入口' },
    ],
  },
  {
    index: '02', name: '产品与技术 Spec', status: 'future', statusLabel: '未执行',
    items: [{ label: '技术 Spec', status: '未执行', tag: 'pending', detail: '下一节点执行' }],
  },
  {
    index: '03', name: '开发、自测与用例', status: 'future', statusLabel: '未执行',
    items: [{ label: '实现、单元测试与构建', status: '未执行', tag: 'pending', detail: '后续节点执行' }],
  },
  {
    index: '04', name: '沙箱预览与冒烟', status: 'future', statusLabel: '未执行',
    items: [{ label: '沙箱预览与冒烟', status: '未执行', tag: 'pending', detail: '本页原型预览不计为正式冒烟' }],
  },
  {
    index: '05', name: '真实 E2E 与证据', status: 'future', statusLabel: '未执行',
    items: [{ label: '真实浏览器 E2E、报告与截图', status: '未执行', tag: 'pending', detail: '后续节点执行' }],
  },
  {
    index: '06', name: '代码评审与 PR 交付', status: 'future', statusLabel: '未创建',
    items: [{ label: '代码审查与 open/unmerged PR', status: '未创建', tag: 'pending', detail: '后续节点执行' }],
  },
  {
    index: '07', name: '人工发布决策', status: 'pending', statusLabel: '待确认',
    items: [{ label: '合并与发布决策', status: '待确认', tag: 'pending', detail: '不代用户审批；不自动合并' }],
  },
];

const AC_ROWS = [
  { id: 'AC-01', name: '12 条合成工作项、状态分组与合成标识', status: 'covered', note: '本轮原型浏览器验收通过；报告 evidence/browser-acceptance.json' },
  { id: 'AC-02', name: '新增合法、编辑保存、取消无修改', status: 'covered', note: '本轮原型浏览器验收通过；报告 evidence/browser-acceptance.json' },
  { id: 'AC-03', name: '空白/超长标题、超长描述被拒绝且反馈清晰', status: 'covered', note: '本轮原型浏览器验收通过；报告 evidence/browser-acceptance.json' },
  { id: 'AC-04', name: '关键词、类型、优先级、状态组合筛选与清空', status: 'covered', note: '本轮原型浏览器验收通过；报告 evidence/browser-acceptance.json' },
  { id: 'AC-05', name: '合法流转、历史、非法拒绝、已完成只读', status: 'covered', note: '本轮原型浏览器验收通过；报告 evidence/browser-acceptance.json' },
  { id: 'AC-06', name: '刷新保留、损坏/不可用受控反馈', status: 'covered', note: '本轮原型浏览器验收通过；报告 evidence/browser-acceptance.json' },
  { id: 'AC-07', name: '计数与卡片一致、完成率正确、零结果无 NaN', status: 'covered', note: '本轮原型浏览器验收通过；报告 evidence/browser-acceptance.json' },
  { id: 'AC-08', name: '详情记录与证据类型正确，示例不冒充真实', status: 'covered', note: '本轮原型浏览器验收通过；报告 evidence/browser-acceptance.json' },
  { id: 'AC-09', name: '复位取消无变化，确认只重置本 Demo', status: 'covered', note: '本轮原型浏览器验收通过；报告 evidence/browser-acceptance.json' },
  { id: 'AC-10', name: 'HTML/脚本安全显示，无真实凭据/身份/客户数据', status: 'covered', note: '本轮原型浏览器验收通过；报告 evidence/browser-acceptance.json' },
  { id: 'AC-11', name: '键盘可用、窄屏无遮挡、无 console error', status: 'covered', note: '本轮原型浏览器验收通过；报告 evidence/browser-acceptance.json' },
  { id: 'AC-12', name: 'PRD、Spec、分支 commit、测试、预览、E2E、审查、PR', status: 'partial', note: '本节点评审已通过；仅 PRD/原型/分支，其余未执行' },
];

let boardState = null;
let persistence = { mode: 'ok', raw: null, message: '', dirty: false, overwriteConfirmed: false };
let filters = { q: '', type: 'all', priority: 'all', status: 'all' };
let activeView = 'board';
let activeItemId = null;
let modalState = null;
let detailNotice = null;
let lastFocused = null;
let trapHandler = null;
let toastTimer = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

function svgIcon(name) {
  return ICONS[name] || '';
}

function uid(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function charCount(value) {
  return Array.from(String(value || '')).length;
}

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso));
  } catch {
    return String(iso || '');
  }
}

function formatFullDate(iso) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso));
  } catch {
    return String(iso || '');
  }
}

function evidenceTag(kind) {
  if (kind === 'real') return '<span class="evidence-tag tag-real">本轮真实产物</span>';
  if (kind === 'pending') return '<span class="evidence-tag tag-pending">未执行/待确认</span>';
  return '<span class="evidence-tag tag-sample">示例记录</span>';
}

function statusPill(status) {
  return `<span class="status-pill status-${esc(status)}"><span class="dot dot-${STATUS_META.find((item) => item.value === status)?.key || 'plan'}"></span>${esc(status)}</span>`;
}

function h(id, at, from, to, result, reason, actor) {
  return { id, at, from, to, result, reason, actor };
}

function sampleEvidence(id, title, detail, type = 'note') {
  return { id, title, kind: 'sample', type, status: '示例', detail };
}

function seedItems() {
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
  ];
}

function createSeedState() {
  return {
    version: APP_VERSION,
    items: JSON.parse(JSON.stringify(seedItems())),
    updatedAt: '2026-11-27T08:00:00.000Z',
  };
}

function validateBoardState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, reason: '顶层不是对象' };
  if (value.version !== APP_VERSION) return { ok: false, reason: `版本不匹配：${String(value.version)}` };
  if (!Array.isArray(value.items)) return { ok: false, reason: 'items 不是数组' };
  const seen = new Set();
  for (let index = 0; index < value.items.length; index += 1) {
    const item = value.items[index];
    if (!item || typeof item !== 'object' || Array.isArray(item)) return { ok: false, reason: `第 ${index + 1} 条工作项不是对象` };
    for (const field of ['id', 'type', 'title', 'description', 'priority', 'assignee', 'acceptance', 'status', 'createdAt', 'updatedAt']) {
      if (typeof item[field] !== 'string') return { ok: false, reason: `第 ${index + 1} 条缺少字段 ${field}` };
    }
    if (!TYPE_LABELS[item.type]) return { ok: false, reason: `第 ${index + 1} 条类型非法` };
    if (!PRIORITIES.includes(item.priority)) return { ok: false, reason: `第 ${index + 1} 条优先级非法` };
    if (!STATUS_VALUES.includes(item.status)) return { ok: false, reason: `第 ${index + 1} 条状态非法` };
    if (seen.has(item.id)) return { ok: false, reason: `工作项 ID 重复：${item.id}` };
    seen.add(item.id);
    if (!Array.isArray(item.history) || !Array.isArray(item.evidence)) return { ok: false, reason: `第 ${index + 1} 条历史或证据不是数组` };
    for (const event of item.history) {
      if (!event || typeof event !== 'object') return { ok: false, reason: `第 ${index + 1} 条历史事件非法` };
      if (event.from !== null && !STATUS_VALUES.includes(event.from)) return { ok: false, reason: `第 ${index + 1} 条历史来源状态非法` };
      if (!STATUS_VALUES.includes(event.to)) return { ok: false, reason: `第 ${index + 1} 条历史目标状态非法` };
      if (!['success', 'rejected'].includes(event.result)) return { ok: false, reason: `第 ${index + 1} 条历史结果非法` };
    }
    for (const evidence of item.evidence) {
      if (!evidence || typeof evidence !== 'object') return { ok: false, reason: `第 ${index + 1} 条证据非法` };
      if (!['sample', 'real', 'pending'].includes(evidence.kind)) return { ok: false, reason: `第 ${index + 1} 条证据类型非法` };
      if (typeof evidence.title !== 'string') return { ok: false, reason: `第 ${index + 1} 条证据标题非法` };
    }
  }
  return { ok: true };
}

function loadBoardState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { state: createSeedState(), mode: 'ok', raw: null, message: '' };
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { state: createSeedState(), mode: 'corrupt', raw, message: '本地数据不是合法 JSON，原始内容已保留。' };
    }
    const validation = validateBoardState(parsed);
    if (!validation.ok) {
      return { state: createSeedState(), mode: 'corrupt', raw, message: `本地数据结构不符合当前版本：${validation.reason}。原始内容已保留。` };
    }
    return { state: parsed, mode: 'ok', raw, message: '' };
  } catch (error) {
    return {
      state: createSeedState(),
      mode: 'unavailable',
      raw: null,
      message: `浏览器存储不可用：${error && error.message ? error.message : '无法访问 localStorage'}。改动仅在本次页面保留。`,
    };
  }
}

function persistState() {
  if (persistence.mode === 'corrupt' && !persistence.overwriteConfirmed) {
    persistence.dirty = true;
    renderStorageBanner();
    return false;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(boardState));
    persistence = { mode: 'ok', raw: null, message: '', dirty: false, overwriteConfirmed: false };
    renderStorageBanner();
    return true;
  } catch (error) {
    persistence.mode = 'write-error';
    persistence.dirty = true;
    persistence.message = `写入 localStorage 失败：${error && error.message ? error.message : '未知错误'}。改动仅在本次页面保留。`;
    renderStorageBanner();
    return false;
  }
}

function forceWriteState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(boardState));
    persistence = { mode: 'ok', raw: null, message: '', dirty: false, overwriteConfirmed: false };
    renderStorageBanner();
    return true;
  } catch (error) {
    persistence = {
      mode: 'unavailable',
      raw: null,
      message: `浏览器存储不可用：${error && error.message ? error.message : '无法写入 localStorage'}。改动仅在本次页面保留。`,
      dirty: true,
      overwriteConfirmed: false,
    };
    renderStorageBanner();
    return false;
  }
}

function getFilteredItems() {
  const q = filters.q.trim().toLocaleLowerCase('zh-CN');
  return boardState.items.filter((item) => {
    const text = `${item.title}\n${item.description}`.toLocaleLowerCase('zh-CN');
    const matchesQuery = !q || text.includes(q);
    const matchesType = filters.type === 'all' || item.type === filters.type;
    const matchesPriority = filters.priority === 'all' || item.priority === filters.priority;
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    return matchesQuery && matchesType && matchesPriority && matchesStatus;
  });
}

function getStats(items) {
  const counts = Object.fromEntries(STATUS_VALUES.map((status) => [status, 0]));
  items.forEach((item) => { counts[item.status] += 1; });
  const total = items.length;
  const completed = counts['已完成'];
  return {
    total,
    counts,
    completed,
    rate: total === 0 ? null : Math.round((completed / total) * 100),
  };
}

function activeFilterText() {
  const parts = [];
  if (filters.q.trim()) parts.push(`关键词「${filters.q.trim()}」`);
  if (filters.type !== 'all') parts.push(`类型：${TYPE_LABELS[filters.type]}`);
  if (filters.priority !== 'all') parts.push(`优先级：${filters.priority}`);
  if (filters.status !== 'all') parts.push(`状态：${filters.status}`);
  return parts.length ? parts.join(' · ') : '未设置筛选';
}

function renderNav() {
  $$('[data-view]').forEach((button) => {
    if (button.dataset.view === activeView) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function renderStats() {
  const items = getFilteredItems();
  const stats = getStats(items);
  const grid = $('#stats-grid');
  if (!grid) return;
  const statusCards = STATUS_META.map((status) => {
    const count = stats.counts[status.value];
    const percent = stats.total ? Math.round((count / stats.total) * 100) : 0;
    return `
      <div class="stat-card" data-stat-card="${status.value}">
        <div class="stat-label"><i class="mini-dot dot-${status.key}" aria-hidden="true"></i>${status.label}</div>
        <div class="stat-value" data-stat-status="${status.value}" data-testid="stat-${status.key}">${count}</div>
        <div class="stat-sub">占当前集合 ${stats.total ? `${percent}%` : '无数据'}</div>
      </div>`;
  }).join('');
  grid.innerHTML = `
    <div class="stat-card total">
      <div class="stat-label">当前筛选总数</div>
      <div class="stat-value" id="stat-total" data-testid="stat-total">${stats.total}</div>
      <div class="stat-sub">全量 ${boardState.items.length} 条 · 当前集合 ${stats.total} 条</div>
    </div>
    ${statusCards}
    <div class="stat-card completion">
      <div class="stat-label">完成率</div>
      <div class="stat-value" id="stat-completion" data-testid="stat-completion">${stats.rate === null ? '无数据' : `${stats.rate}%`}</div>
      <div class="stat-sub">${stats.total === 0 ? '当前筛选集合为空' : `${stats.completed} / ${stats.total} 已完成`}</div>
      <div class="progress-track" aria-hidden="true"><div class="progress-fill" style="width:${stats.rate === null ? 0 : Math.max(0, Math.min(100, stats.rate))}%"></div></div>
    </div>`;
}

function renderBoard() {
  const items = getFilteredItems();
  const board = $('#board');
  const empty = $('#empty-state');
  if (!board) return;
  board.innerHTML = STATUS_META.map((status, index) => {
    const columnItems = items.filter((item) => item.status === status.value);
    const cards = columnItems.map((item) => {
      const desc = item.description || '未填写描述';
      const doneClass = item.status === '已完成' ? ' done' : '';
      return `
        <button class="work-card${doneClass}" type="button" data-action="open-item" data-id="${esc(item.id)}" data-status="${esc(item.status)}" data-testid="item-card" aria-label="打开 ${esc(item.id)} ${esc(item.title)} 详情">
          <span class="card-top">
            <span class="card-badges">
              <span class="type-badge type-${esc(item.type)}">${esc(TYPE_LABELS[item.type])}</span>
              <span class="priority-badge priority-${esc(item.priority)}">${esc(item.priority)}</span>
            </span>
            <span class="card-id">${esc(item.id)}</span>
          </span>
          <span class="card-title">${esc(item.title)}</span>
          <span class="card-desc">${esc(desc)}</span>
          <span class="card-foot">
            <span class="assignee"><span class="avatar" aria-hidden="true">${esc(item.assignee.slice(0, 1))}</span>${esc(item.assignee)}</span>
            <span class="card-evidence">${svgIcon('file')}${item.evidence.length} 项证据</span>
          </span>
        </button>`;
    }).join('');
    return `
      <section class="board-column" data-status="${esc(status.value)}" role="listitem" aria-labelledby="column-title-${index}">
        <div class="column-head">
          <span class="column-title"><i class="dot" aria-hidden="true"></i><strong id="column-title-${index}">${status.label}</strong></span>
          <span class="column-count" data-column-count="${esc(status.value)}" aria-label="${status.label}共 ${columnItems.length} 条">${columnItems.length}</span>
        </div>
        <div class="column-items">
          ${cards || '<div class="column-empty">当前筛选下暂无工作项</div>'}
        </div>
      </section>`;
  }).join('');
  if (empty) empty.hidden = items.length !== 0;
}

function renderFilterSummary() {
  const items = getFilteredItems();
  const summary = $('#filter-summary');
  if (!summary) return;
  summary.innerHTML = `当前显示 <strong>${items.length}</strong> / ${boardState.items.length} 条 · ${esc(activeFilterText())}`;
}

function renderFilterState() {
  const search = $('#search-input');
  const type = $('#filter-type');
  const priority = $('#filter-priority');
  const status = $('#filter-status');
  if (search) search.value = filters.q;
  if (type) type.value = filters.type;
  if (priority) priority.value = filters.priority;
  if (status) status.value = filters.status;
}

function renderStorageBanner() {
  const banner = $('#storage-banner');
  if (!banner) return;
  if (persistence.mode === 'ok' && !persistence.dirty) {
    banner.hidden = true;
    banner.innerHTML = '';
    return;
  }
  const isCorrupt = persistence.mode === 'corrupt';
  const isWriteError = persistence.mode === 'write-error';
  const title = isCorrupt
    ? '本地数据无法安全读取，当前显示合成种子数据'
    : isWriteError
      ? '保存失败，改动仅在本次页面保留'
      : '浏览器存储不可用，改动仅在本次页面保留';
  const message = persistence.message || '请检查浏览器隐私设置或存储配额。';
  const actions = [
    isCorrupt && persistence.raw !== null ? '<button class="btn btn-outline btn-small" type="button" data-action="export-raw">导出原始数据</button>' : '',
    isCorrupt ? '<button class="btn btn-danger btn-small" type="button" data-action="overwrite-corrupt">用当前数据覆盖</button>' : '',
    !isCorrupt ? '<button class="btn btn-outline btn-small" type="button" data-action="retry-save">重试保存</button>' : '',
  ].join('');
  banner.innerHTML = `
    <div class="banner-copy">
      <span aria-hidden="true">${svgIcon('alert')}</span>
      <div><strong>${esc(title)}</strong><span>${esc(message)}${isCorrupt ? ' 在你确认前，不会删除或覆盖原始内容。' : ''}</span></div>
    </div>
    <div class="banner-actions">${actions}</div>`;
  banner.hidden = false;
}

function renderEvidence() {
  const content = $('#evidence-content');
  if (!content) return;
  const stages = CAPABILITY_STAGES.map((stage) => {
    const statusClass = stage.status === 'current' ? 'active' : stage.status === 'pending' ? 'pending' : 'future';
    return `
      <article class="stage-card ${stage.current ? 'current' : 'future'}" data-testid="stage-card">
        <div class="stage-top">
          <div><p class="stage-index">NODE ${stage.index}</p><h2 class="stage-name">${esc(stage.name)}</h2></div>
          <span class="stage-status ${statusClass}">${esc(stage.statusLabel)}</span>
        </div>
        <ul class="stage-items">
          ${stage.items.map((item) => `
            <li>
              <span><strong>${esc(item.label)}</strong><small>${esc(item.detail || '')}</small></span>
              <span class="evidence-tag ${item.tag === 'real' ? 'tag-real' : item.tag === 'pending' ? 'tag-pending' : 'tag-sample'}">${esc(item.status)}</span>
            </li>`).join('')}
        </ul>
        ${stage.index === '01' ? `
          <div class="guide-actions">
            <a class="btn btn-outline btn-small" href="evidence/PRD.html" target="_blank" rel="noopener">打开 PRD HTML ${svgIcon('external')}</a>
            <a class="btn btn-ghost btn-small" href="evidence/PRD.md" target="_blank" rel="noopener">PRD Markdown ${svgIcon('external')}</a>
          </div>` : ''}
      </article>`;
  }).join('');
  const acRows = AC_ROWS.map((row) => {
    const label = row.status === 'covered' ? '已覆盖' : row.status === 'partial' ? '部分' : '未执行';
    return `<tr><td>${esc(row.id)}</td><td>${esc(row.name)}</td><td><span class="ac-status ac-${row.status}">${label}</span></td><td>${esc(row.note)}</td></tr>`;
  }).join('');
  content.innerHTML = `
    <div class="evidence-grid">${stages}</div>
    <section class="ac-block" aria-labelledby="ac-title">
      <h2 id="ac-title">AC-01..AC-12 追溯</h2>
      <p>“已覆盖”表示本轮原型已在浏览器中验证；不代表最终 React 实现、真实 E2E 或平台流程已经通过。</p>
      <div class="ac-table-wrap">
        <table class="ac-table">
          <thead><tr><th>编号</th><th>验收点</th><th>状态</th><th>说明</th></tr></thead>
          <tbody>${acRows}</tbody>
        </table>
      </div>
    </section>
    <p class="evidence-foot">产物入口：<a href="evidence/PRD.html" target="_blank" rel="noopener">PRD HTML</a> · <a href="evidence/PRD.md" target="_blank" rel="noopener">PRD Markdown</a> · <a href="design-notes.md" target="_blank" rel="noopener">design-notes.md</a>。分支提交、PR 与发布状态以仓库和平台记录为准，本页不伪造链接。</p>`;
}

function renderGuide() {
  const content = $('#guide-content');
  if (!content) return;
  const steps = [
    ['展示需求与授权边界', '说明本次使用专用流程“SDLC Demo｜测试与 PR”，不合并、不发布、不改 main、不操作真实数据。'],
    ['查看 PRD 与原型', '打开 PRD Markdown/HTML 与本页原型，说明本节点评审已通过；下游 Spec 与实现节点尚未执行。'],
    ['操作成功与失败路径', '新增工作项、触发空白/超长校验、搜索筛选、合法与非法流转、刷新持久化。'],
    ['对照 AC 与证据', '在能力证据页按 AC-01..AC-12 查看本轮已覆盖项和下游未执行项；示例证据带“示例记录”标签。'],
    ['停在人工发布决策', '本节点评审已通过；后续 PR 完成后仍停在人工发布决策，不代用户审批。演示复位只重置本应用数据。'],
  ].map(([title, desc], index) => `
    <div class="guide-step"><span class="step-num">${index + 1}</span><div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div></div>`).join('');
  content.innerHTML = `
    <div class="guide-grid">
      <section class="guide-card" aria-labelledby="guide-steps-title">
        <h2 id="guide-steps-title">演示步骤</h2>
        ${steps}
        <div class="guide-actions">
          <button class="btn btn-primary btn-small" type="button" data-action="open-new">${svgIcon('plus')}现在新增一条</button>
          <button class="btn btn-outline btn-small" type="button" data-action="go-evidence">${svgIcon('evidence')}查看能力证据</button>
          <a class="btn btn-ghost btn-small" href="evidence/PRD.html" target="_blank" rel="noopener">打开 PRD ${svgIcon('external')}</a>
        </div>
      </section>
      <div>
        <section class="guide-card" aria-labelledby="roles-title">
          <h2 id="roles-title">四角色分工</h2>
          <div class="role-grid">
            <div class="role-chip"><strong>示例产品</strong><small>需求、验收与证据分级</small></div>
            <div class="role-chip"><strong>示例研发</strong><small>实现、状态流转与持久化</small></div>
            <div class="role-chip"><strong>示例测试</strong><small>筛选、统计与异常路径</small></div>
            <div class="role-chip"><strong>示例设计</strong><small>桌面/窄屏与键盘体验</small></div>
          </div>
        </section>
        <section class="guide-card" aria-labelledby="boundary-title" style="margin-top:12px">
          <h2 id="boundary-title">边界与真实性</h2>
          <ul class="boundary-list">
            <li>${svgIcon('check')}<span><strong>演示合成数据。</strong>没有真实客户、员工、凭据或生产数据。</span></li>
            <li>${svgIcon('check')}<span><strong>示例证据不冒充真实。</strong>示例记录带标签，未执行项不会显示 PASS。</span></li>
            <li>${svgIcon('check')}<span><strong>不是公开发布。</strong>本页只在工作区沙箱预览，不更新 GitHub Pages。</span></li>
            <li>${svgIcon('check')}<span><strong>复位不是平台 reset。</strong>只重置 <span class="reset-code">sdlc-demo-board:v1</span>，不影响其他 key。</span></li>
          </ul>
        </section>
      </div>
    </div>`;
}

function renderDetail() {
  const root = $('#overlay-root');
  if (!root) return;
  if (!activeItemId) {
    root.innerHTML = '';
    releaseTrap();
    return;
  }
  const item = boardState.items.find((candidate) => candidate.id === activeItemId);
  if (!item) {
    activeItemId = null;
    root.innerHTML = '';
    releaseTrap();
    return;
  }
  const done = item.status === '已完成';
  const allowed = TRANSITIONS[item.status] || [];
  const transitionOptions = [...allowed, ...STATUS_VALUES.filter((status) => status !== item.status && !allowed.includes(status))];
  const history = item.history.slice().sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const historyHtml = history.map((event) => {
    const from = event.from ? `「${event.from}」` : '创建';
    const title = event.result === 'rejected' ? `${from} → 「${event.to}」` : `${from} → 「${event.to}」`;
    return `
      <li class="${event.result === 'rejected' ? 'rejected' : ''}">
        <div class="timeline-top">
          <span class="timeline-title">${esc(title)}</span>
          <span class="result-badge ${event.result === 'rejected' ? 'result-rejected' : 'result-success'}">${event.result === 'rejected' ? '拒绝' : '成功'}</span>
          <span class="timeline-time">${esc(formatDate(event.at))}</span>
        </div>
        <p class="timeline-reason">${esc(event.reason)} · ${esc(event.actor)}</p>
      </li>`;
  }).join('');
  const evidenceHtml = item.evidence.length ? item.evidence.map((evidence) => `
    <div class="evidence-item">
      <div class="evidence-item-top"><strong>${esc(evidence.title)}</strong>${evidenceTag(evidence.kind)}</div>
      <p>${esc(evidence.detail)}${evidence.status ? ` · 状态：${esc(evidence.status)}` : ''}</p>
    </div>`).join('') : '<p class="detail-text muted">暂无证据记录。</p>';
  const acceptanceItems = item.acceptance.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const realEvidence = [
    ['PRD Markdown', '已生成', 'real'],
    ['PRD HTML', '已生成', 'real'],
    ['交互原型', '已生成', 'real'],
    ['浏览器验收', DELIVERY_STATE.browserAcceptance, 'real'],
    ['用户评审', DELIVERY_STATE.review, 'real'],
    ['单元测试 / 真实 E2E / PR', '未执行 / 未创建', 'pending'],
  ];
  const transitionBox = done ? `
    <div class="readonly-note">${svgIcon('lock')}<span><strong>已完成工作项只读。</strong>不会提供编辑或状态流转入口，也不会自动重开。如需继续处理，请新建工作项。</span></div>` : `
    <div class="transition-box">
      <div class="transition-row">
        <label for="transition-select">变更状态
          <select id="transition-select" data-testid="transition-select">
            ${transitionOptions.map((status) => `<option value="${esc(status)}">${esc(status)}</option>`).join('')}
          </select>
        </label>
        <button class="btn btn-secondary btn-small" type="button" data-action="transition-submit" data-testid="transition-submit">${svgIcon('arrow')}执行流转</button>
      </div>
      <p class="transition-hint">允许的目标状态：${allowed.length ? allowed.map((status) => `「${status}」`).join('、') : '无（已完成只读）'}。非法目标会被拒绝并写入拒绝历史。</p>
      ${detailNotice ? `<div class="transition-alert" id="transition-alert" role="alert" data-testid="transition-alert">${svgIcon('alert')}<span>${esc(detailNotice)}</span></div>` : ''}
    </div>`;
  root.innerHTML = `
    <div class="overlay drawer-overlay" data-overlay="drawer">
      <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title" data-testid="detail-drawer">
        <div class="drawer-head">
          <div class="drawer-kicker">
            <span class="drawer-id">${esc(item.id)}</span>
            <button class="close-btn" type="button" data-action="close-detail" aria-label="关闭详情" data-testid="close-detail">${svgIcon('x')}</button>
          </div>
          <h2 class="drawer-title" id="detail-title" tabindex="-1" data-testid="detail-title">${esc(item.title)}</h2>
          <div class="drawer-meta-row">
            <span class="type-badge type-${esc(item.type)}">${esc(TYPE_LABELS[item.type])}</span>
            <span class="priority-badge priority-${esc(item.priority)}">${esc(item.priority)}</span>
            ${statusPill(item.status)}
            <span class="badge badge-neutral">${esc(item.assignee)}</span>
            <span class="badge badge-neutral">证据 ${item.evidence.length} 项</span>
          </div>
        </div>
        <div class="drawer-body">
          <div class="drawer-actions">
            ${done ? `<span class="readonly-note" style="margin-top:0">${svgIcon('check')}<span>已完成，只读</span></span>` : `<button class="btn btn-primary btn-small" type="button" data-action="edit-item" data-id="${esc(item.id)}" data-testid="edit-item">${svgIcon('edit')}编辑工作项</button>`}
            <button class="btn btn-outline btn-small" type="button" data-action="go-evidence">${svgIcon('evidence')}能力证据</button>
          </div>
          <section class="detail-section">
            <h3>${svgIcon('file')}业务说明</h3>
            <p class="detail-text">${item.description ? esc(item.description) : '<span class="detail-text muted">未填写描述。</span>'}</p>
          </section>
          <section class="detail-section">
            <h3>${svgIcon('list')}验收清单</h3>
            ${acceptanceItems.length ? `<ul class="acceptance-list">${acceptanceItems.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>` : '<p class="detail-text muted">未填写验收说明。</p>'}
          </section>
          <section class="detail-section">
            <h3>${svgIcon('arrow')}状态流转</h3>
            ${transitionBox}
          </section>
          <section class="detail-section" data-testid="detail-history">
            <h3>${svgIcon('history')}状态历史</h3>
            <ol class="timeline">${historyHtml || '<li><p class="timeline-reason">暂无历史记录。</p></li>'}</ol>
          </section>
          <section class="detail-section" data-testid="detail-evidence">
            <h3>${svgIcon('file')}证据清单</h3>
            <div class="evidence-list">${evidenceHtml}</div>
            <div class="real-evidence-box" data-testid="detail-real-evidence">
              <h4>本轮真实产物（全局，不随工作项状态变化）</h4>
              <ul>${realEvidence.map(([label, status, kind]) => `<li><span>${esc(label)}</span><span class="evidence-tag ${kind === 'real' ? 'tag-real' : 'tag-pending'}">${esc(status)}</span></li>`).join('')}</ul>
            </div>
          </section>
          <section class="detail-section">
            <h3>${svgIcon('board')}元数据</h3>
            <dl class="meta-grid">
              <div><dt>创建时间</dt><dd>${esc(formatFullDate(item.createdAt))}</dd></div>
              <div><dt>最近更新</dt><dd>${esc(formatFullDate(item.updatedAt))}</dd></div>
              <div><dt>工作项 ID</dt><dd>${esc(item.id)}</dd></div>
              <div><dt>数据性质</dt><dd>演示合成数据</dd></div>
            </dl>
          </section>
        </div>
      </aside>
    </div>`;
  setTrap($('.drawer', root));
  if (detailNotice) {
    requestAnimationFrame(() => {
      const alert = $('#transition-alert');
      if (alert) alert.focus();
    });
  }
}

function renderModal() {
  const root = $('#overlay-root');
  if (!root) return;
  if (!modalState) {
    root.innerHTML = '';
    releaseTrap();
    return;
  }
  if (modalState.kind === 'reset') {
    const step = modalState.step || 1;
    root.innerHTML = `
      <div class="overlay modal-overlay" data-overlay="modal">
        <div class="modal small" role="dialog" aria-modal="true" aria-labelledby="reset-title" data-testid="reset-modal">
          <div class="reset-icon">${svgIcon('reset')}</div>
          <div class="modal-head">
            <div>
              <p class="modal-kicker">演示复位 · 第 ${step} / 2 步</p>
              <h2 class="modal-title" id="reset-title" data-testid="reset-step-${step}">${step === 1 ? '只重置本应用的演示数据' : '确认重置本应用数据？'}</h2>
              <p class="modal-sub">${step === 1 ? '这个操作不会删除工作区产物，也不会触发平台 reset。' : '下一步会覆盖本应用自己的 localStorage key。'}</p>
            </div>
            <button class="close-btn" type="button" data-action="close-modal" aria-label="关闭复位对话框">${svgIcon('x')}</button>
          </div>
          ${step === 1 ? `
            <ul class="reset-list">
              <li>仅重置本应用 key <span class="reset-code">sdlc-demo-board:v1</span> 为 12 条合成种子。</li>
              <li>不会清空其他 localStorage key，也不会影响 PRD、原型或 Git 分支。</li>
              <li>这不是产品空间、平台任务或 Git 的 reset。</li>
            </ul>
            <div class="warn-box">如果本应用数据已损坏，复位会用合成种子覆盖本应用 key；其他数据保持不变。</div>
            <div class="modal-actions">
              <button class="btn btn-outline" type="button" data-action="close-modal" data-testid="reset-cancel">取消</button>
              <button class="btn btn-danger" type="button" data-action="reset-continue" data-testid="reset-continue">继续复位 ${svgIcon('arrow')}</button>
            </div>` : `
            <div class="warn-box">确认后将立即恢复 12 条合成工作项，并清空当前筛选。这个操作不可撤销，但只影响本应用 key。</div>
            <div class="modal-actions">
              <button class="btn btn-outline" type="button" data-action="close-modal" data-testid="reset-cancel">取消</button>
              <button class="btn btn-danger" type="button" data-action="reset-confirm" data-testid="reset-confirm">确认重置本应用数据</button>
            </div>`}
        </div>
      </div>`;
    setTrap($('.modal', root));
    requestAnimationFrame(() => $('[data-action="reset-continue"], [data-action="reset-confirm"]', root)?.focus());
    return;
  }

  const item = modalState.itemId ? boardState.items.find((candidate) => candidate.id === modalState.itemId) : null;
  const isEdit = modalState.mode === 'edit' && item;
  const value = isEdit ? item : { type: 'requirement', title: '', description: '', priority: 'P2', assignee: '示例产品', acceptance: '' };
  root.innerHTML = `
    <div class="overlay modal-overlay" data-overlay="modal">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="item-modal-title" data-testid="item-modal">
        <div class="modal-head">
          <div>
            <p class="modal-kicker">${isEdit ? `编辑 ${esc(item.id)}` : '新增工作项'} · 演示合成数据</p>
            <h2 class="modal-title" id="item-modal-title">${isEdit ? '编辑工作项' : '新增工作项'}</h2>
            <p class="modal-sub">${isEdit ? '保存后保留原状态、历史和证据；取消不会写入任何修改。' : '新工作项默认进入待规划。保存后写入本应用 localStorage，不调用后端。'}</p>
          </div>
          <button class="close-btn" type="button" data-action="close-modal" aria-label="关闭对话框">${svgIcon('x')}</button>
        </div>
        <form id="item-form" novalidate data-testid="item-form">
          <div class="form-grid">
            <fieldset class="field full" style="border:0;padding:0;margin:0">
              <legend class="field-label">类型</legend>
              <div class="segmented">
                <label><input type="radio" name="type" value="requirement" ${value.type === 'requirement' ? 'checked' : ''} /><span>需求</span></label>
                <label><input type="radio" name="type" value="defect" ${value.type === 'defect' ? 'checked' : ''} /><span>缺陷</span></label>
              </div>
            </fieldset>
            <div class="field full">
              <label for="item-title">标题 <span class="counter" id="counter-title">${charCount(value.title)} / 80</span></label>
              <input id="item-title" name="title" type="text" value="${esc(value.title)}" placeholder="例如：筛选条件记忆" autocomplete="off" aria-describedby="error-title title-help" data-testid="title-input" />
              <p class="form-note" id="title-help">必填；保存时去除前后空格，按 Unicode 字符计 1-80。</p>
              <p class="field-error" id="error-title" data-testid="form-error-title" aria-live="polite"></p>
            </div>
            <div class="field">
              <label for="item-priority">优先级</label>
              <select id="item-priority" name="priority" data-testid="priority-input">
                ${PRIORITIES.map((priority) => `<option value="${priority}" ${value.priority === priority ? 'selected' : ''}>${priority}</option>`).join('')}
              </select>
              <p class="field-error" id="error-priority" aria-live="polite"></p>
            </div>
            <div class="field">
              <label for="item-assignee">示例负责人</label>
              <select id="item-assignee" name="assignee" data-testid="assignee-input">
                ${ASSIGNEES.map((assignee) => `<option value="${esc(assignee)}" ${value.assignee === assignee ? 'selected' : ''}>${esc(assignee)}</option>`).join('')}
              </select>
              <p class="field-error" id="error-assignee" aria-live="polite"></p>
            </div>
            <div class="field full">
              <label for="item-description">描述 <span class="counter" id="counter-description">${charCount(value.description)} / 2000</span></label>
              <textarea id="item-description" name="description" placeholder="补充业务背景、复现步骤或边界。内容会作为纯文本显示。" aria-describedby="error-description" data-testid="description-input">${esc(value.description)}</textarea>
              <p class="field-error" id="error-description" data-testid="form-error-description" aria-live="polite"></p>
            </div>
            <div class="field full">
              <label for="item-acceptance">验收说明 <span class="counter" id="counter-acceptance">${charCount(value.acceptance)} / 2000</span></label>
              <textarea id="item-acceptance" name="acceptance" class="tall" placeholder="每行一条验收清单，例如：&#10;刷新后保留修改&#10;非法流转被拒绝" aria-describedby="error-acceptance acceptance-help" data-testid="acceptance-input">${esc(value.acceptance)}</textarea>
              <p class="form-note" id="acceptance-help">可选；最多 2000 字符；每行会显示为一条验收清单。</p>
              <p class="field-error" id="error-acceptance" data-testid="form-error-acceptance" aria-live="polite"></p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost btn-small" type="button" data-action="close-modal" data-testid="cancel-item">取消</button>
            <span class="spacer"></span>
            <button class="btn btn-primary" type="submit" data-testid="save-item">${isEdit ? '保存修改' : '创建待规划工作项'}</button>
          </div>
        </form>
      </div>
    </div>`;
  setTrap($('.modal', root));
  requestAnimationFrame(() => {
    const title = $('#item-title');
    if (title) {
      title.focus();
      title.setSelectionRange(title.value.length, title.value.length);
    }
  });
}

function renderDynamic() {
  renderStats();
  renderBoard();
  renderFilterSummary();
}

function renderOverlay() {
  if (modalState) {
    renderModal();
    return;
  }
  renderDetail();
}

function renderAll() {
  renderNav();
  renderStats();
  renderFilterState();
  renderBoard();
  renderFilterSummary();
  renderStorageBanner();
  renderEvidence();
  renderGuide();
  renderOverlay();
}

function setView(view, updateHash = true) {
  if (!['board', 'evidence', 'guide'].includes(view)) view = 'board';
  if (modalState) closeModal(false);
  if (activeItemId) closeDetail(false);
  activeView = view;
  $$('.view').forEach((section) => { section.hidden = section.id !== `view-${view}`; });
  renderNav();
  if (updateHash) {
    try { window.history.replaceState(null, '', `#${view}`); } catch { /* file:// 等环境忽略 */ }
  }
  const target = view === 'board' ? $('#board-title') : view === 'evidence' ? $('#evidence-title') : $('#guide-title');
  if (target) target.focus({ preventScroll: true });
}

function openDetail(id) {
  const item = boardState.items.find((candidate) => candidate.id === id);
  if (!item) return;
  if (!activeItemId) lastFocused = document.activeElement;
  activeItemId = id;
  detailNotice = null;
  renderDetail();
  requestAnimationFrame(() => $('[data-action="close-detail"]')?.focus());
}

function closeDetail(restoreFocus = true) {
  const id = activeItemId;
  activeItemId = null;
  detailNotice = null;
  renderDetail();
  if (restoreFocus) {
    const card = id ? document.querySelector(`[data-action="open-item"][data-id="${cssEscape(id)}"]`) : null;
    if (card) card.focus();
    else if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
  return String(value).replace(/["\\]/g, '\\$&');
}

function openItemModal(mode, itemId = null) {
  if (mode === 'edit') {
    const item = boardState.items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    if (item.status === '已完成') {
      showToast('已完成工作项只读，不能编辑。', 'error');
      return;
    }
  }
  const trigger = document.activeElement;
  const returnCard = itemId ? document.querySelector(`[data-action="open-item"][data-id="${cssEscape(itemId)}"]`) : null;
  if (activeItemId) closeDetail(false);
  lastFocused = returnCard || trigger;
  modalState = { kind: 'item', mode, itemId };
  renderModal();
}

function closeModal(restoreFocus = true) {
  modalState = null;
  renderModal();
  if (restoreFocus) {
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
}

function openReset() {
  const trigger = document.activeElement;
  if (activeItemId) closeDetail(false);
  lastFocused = trigger;
  modalState = { kind: 'reset', step: 1 };
  renderModal();
}

function resetDemo() {
  boardState = createSeedState();
  filters = { q: '', type: 'all', priority: 'all', status: 'all' };
  activeItemId = null;
  detailNotice = null;
  modalState = null;
  const persisted = forceWriteState();
  renderAll();
  showToast(persisted ? '已恢复 12 条演示数据；其他 localStorage key 未改动。' : '已恢复 12 条演示数据；本地存储不可用，刷新后可能丢失。', persisted ? 'success' : 'error');
}

function readForm() {
  const form = $('#item-form');
  if (!form) return null;
  const data = new FormData(form);
  return {
    type: String(data.get('type') || ''),
    title: String(data.get('title') || ''),
    description: String(data.get('description') || ''),
    priority: String(data.get('priority') || ''),
    assignee: String(data.get('assignee') || ''),
    acceptance: String(data.get('acceptance') || ''),
  };
}

function showFormErrors(errors) {
  $$('.field-error').forEach((element) => { element.textContent = ''; });
  $$('[aria-invalid="true"]').forEach((element) => element.removeAttribute('aria-invalid'));
  Object.entries(errors).forEach(([field, message]) => {
    const input = document.querySelector(`[name="${field}"]`);
    if (input) input.setAttribute('aria-invalid', 'true');
    const error = document.getElementById(`error-${field}`);
    if (error) error.textContent = message;
  });
  const first = document.querySelector('#item-form [aria-invalid="true"]');
  if (first) first.focus();
}

function saveItem() {
  const form = $('#item-form');
  if (!form || !modalState || modalState.kind !== 'item') return;
  const values = readForm();
  if (!values) return;
  const title = values.title.trim();
  const titleLength = charCount(title);
  const descriptionLength = charCount(values.description);
  const acceptanceLength = charCount(values.acceptance);
  const errors = {};
  if (titleLength === 0) errors.title = '标题不能为空。';
  else if (titleLength > 80) errors.title = `标题最多 80 个字符，当前 ${titleLength} 个。`;
  if (descriptionLength > 2000) errors.description = `描述最多 2000 个字符，当前 ${descriptionLength} 个。`;
  if (acceptanceLength > 2000) errors.acceptance = `验收说明最多 2000 个字符，当前 ${acceptanceLength} 个。`;
  if (!TYPE_LABELS[values.type]) errors.type = '请选择需求或缺陷。';
  if (!PRIORITIES.includes(values.priority)) errors.priority = '请选择合法优先级。';
  if (!ASSIGNEES.includes(values.assignee)) errors.assignee = '请选择示例负责人。';
  if (Object.keys(errors).length) {
    showFormErrors(errors);
    showToast('请先修正表单中的错误；已输入内容已保留。', 'error');
    return;
  }
  const now = nowIso();
  const isEdit = modalState.mode === 'edit';
  let savedId = modalState.itemId;
  if (isEdit) {
    const item = boardState.items.find((candidate) => candidate.id === modalState.itemId);
    if (!item) {
      showToast('工作项已不存在，无法保存。', 'error');
      return;
    }
    if (item.status === '已完成') {
      showToast('已完成工作项只读，不能保存修改。', 'error');
      return;
    }
    item.type = values.type;
    item.title = title;
    item.description = values.description;
    item.priority = values.priority;
    item.assignee = values.assignee;
    item.acceptance = values.acceptance;
    item.updatedAt = now;
  } else {
    const id = nextId();
    savedId = id;
    boardState.items.unshift({
      id,
      type: values.type,
      title,
      description: values.description,
      priority: values.priority,
      assignee: values.assignee,
      acceptance: values.acceptance,
      status: '待规划',
      createdAt: now,
      updatedAt: now,
      history: [h(uid('h'), now, null, '待规划', 'success', '创建为待规划', '示例用户')],
      evidence: [sampleEvidence(uid('e'), '示例记录 · 本页创建', '这是在本页创建的演示工作项，不是真实业务记录。')],
    });
  }
  boardState.updatedAt = now;
  const persisted = persistState();
  modalState = null;
  renderAll();
  if (savedId) openDetail(savedId);
  showToast(persisted ? (isEdit ? '已保存修改。' : '已新增待规划工作项。') : '已更新当前页面；本地持久化不可用。', persisted ? 'success' : 'error');
}

function nextId() {
  let max = 100;
  boardState.items.forEach((item) => {
    const match = /^DEMO-(\d+)$/.exec(item.id);
    if (match) max = Math.max(max, Number(match[1]));
  });
  return `DEMO-${max + 1}`;
}

function attemptTransition(itemId, target) {
  const item = boardState.items.find((candidate) => candidate.id === itemId);
  if (!item) return { ok: false, reason: '工作项不存在。' };
  if (!STATUS_VALUES.includes(target)) return { ok: false, reason: '目标状态不合法。' };
  const allowed = TRANSITIONS[item.status] || [];
  const now = nowIso();
  if (item.status === '已完成') {
    const reason = '已完成工作项只读，不允许任何状态流转，也不会自动重开。';
    item.history.unshift(h(uid('h'), now, item.status, target, 'rejected', reason, '示例用户'));
    boardState.updatedAt = now;
    persistState();
    return { ok: false, reason };
  }
  if (!allowed.includes(target)) {
    const reason = `不允许从「${item.status}」直接流转到「${target}」。允许的目标状态：${allowed.length ? allowed.join('、') : '无'}。`;
    item.history.unshift(h(uid('h'), now, item.status, target, 'rejected', reason, '示例用户'));
    boardState.updatedAt = now;
    persistState();
    return { ok: false, reason };
  }
  const from = item.status;
  item.status = target;
  item.updatedAt = now;
  item.history.unshift(h(uid('h'), now, from, target, 'success', `状态从「${from}」流转到「${target}」。`, '示例用户'));
  boardState.updatedAt = now;
  persistState();
  return { ok: true, reason: '' };
}

function submitTransition() {
  if (!activeItemId) return;
  const select = $('#transition-select');
  const target = select ? select.value : '';
  if (!target) {
    detailNotice = '请选择目标状态。';
    renderDetail();
    return;
  }
  const result = attemptTransition(activeItemId, target);
  if (result.ok) {
    detailNotice = null;
    renderAll();
    showToast(`已流转到「${target}」。`, 'success');
  } else {
    detailNotice = result.reason;
    renderAll();
    showToast(`流转被拒绝：${result.reason}`, 'error');
  }
}

function showToast(message, tone = 'success') {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${tone}`;
  toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
}

function releaseTrap() {
  if (trapHandler) {
    document.removeEventListener('keydown', trapHandler);
    trapHandler = null;
  }
}

function setTrap(container) {
  releaseTrap();
  if (!container) return;
  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  trapHandler = (event) => {
    if (event.key !== 'Tab') return;
    const nodes = $$(focusableSelector, container).filter((node) => node.getClientRects().length > 0 || node === document.activeElement);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  document.addEventListener('keydown', trapHandler);
}

function updateCounter(input, counterId, max) {
  const counter = document.getElementById(counterId);
  if (!counter || !input) return;
  const length = charCount(input.value);
  counter.textContent = `${length} / ${max}`;
  counter.classList.toggle('over', length > max);
}

function clearFilters() {
  filters = { q: '', type: 'all', priority: 'all', status: 'all' };
  renderFilterState();
  renderDynamic();
}

function hydrateIcons() {
  $$('[data-icon]').forEach((element) => {
    element.innerHTML = svgIcon(element.dataset.icon);
  });
}

function handleClick(event) {
  const overlay = event.target.closest('.overlay');
  if (overlay && event.target === overlay) {
    if (overlay.dataset.overlay === 'drawer') closeDetail();
    else if (overlay.dataset.overlay === 'modal') closeModal();
    return;
  }
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) {
    event.preventDefault();
    setView(viewButton.dataset.view);
    return;
  }
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;
  const action = actionButton.dataset.action;
  if (action === 'open-new') {
    event.preventDefault();
    openItemModal('new');
  } else if (action === 'open-reset') {
    event.preventDefault();
    openReset();
  } else if (action === 'open-item') {
    event.preventDefault();
    openDetail(actionButton.dataset.id);
  } else if (action === 'close-detail') {
    event.preventDefault();
    closeDetail();
  } else if (action === 'edit-item') {
    event.preventDefault();
    openItemModal('edit', actionButton.dataset.id);
  } else if (action === 'close-modal') {
    event.preventDefault();
    closeModal();
  } else if (action === 'transition-submit') {
    event.preventDefault();
    submitTransition();
  } else if (action === 'clear-filters') {
    event.preventDefault();
    clearFilters();
  } else if (action === 'reset-continue') {
    event.preventDefault();
    if (modalState && modalState.kind === 'reset') {
      modalState.step = 2;
      renderModal();
    }
  } else if (action === 'reset-confirm') {
    event.preventDefault();
    resetDemo();
  } else if (action === 'go-evidence') {
    event.preventDefault();
    setView('evidence');
  } else if (action === 'export-raw') {
    event.preventDefault();
    exportRaw();
  } else if (action === 'overwrite-corrupt') {
    event.preventDefault();
    overwriteCorrupt();
  } else if (action === 'retry-save') {
    event.preventDefault();
    const ok = persistState();
    showToast(ok ? '已恢复本地持久化。' : '仍无法保存，改动仅在本次页面保留。', ok ? 'success' : 'error');
  }
}

function handleInput(event) {
  const target = event.target;
  if (target.id === 'search-input') {
    filters.q = target.value;
    renderDynamic();
  } else if (target.id === 'item-title') {
    updateCounter(target, 'counter-title', 80);
    if (target.getAttribute('aria-invalid') === 'true') {
      target.removeAttribute('aria-invalid');
      const error = $('#error-title');
      if (error) error.textContent = '';
    }
  } else if (target.id === 'item-description') {
    updateCounter(target, 'counter-description', 2000);
    if (target.getAttribute('aria-invalid') === 'true') {
      target.removeAttribute('aria-invalid');
      const error = $('#error-description');
      if (error) error.textContent = '';
    }
  } else if (target.id === 'item-acceptance') {
    updateCounter(target, 'counter-acceptance', 2000);
    if (target.getAttribute('aria-invalid') === 'true') {
      target.removeAttribute('aria-invalid');
      const error = $('#error-acceptance');
      if (error) error.textContent = '';
    }
  }
}

function handleChange(event) {
  const target = event.target;
  if (target.id === 'filter-type') {
    filters.type = target.value;
    renderDynamic();
  } else if (target.id === 'filter-priority') {
    filters.priority = target.value;
    renderDynamic();
  } else if (target.id === 'filter-status') {
    filters.status = target.value;
    renderDynamic();
  }
}

function handleSubmit(event) {
  if (event.target && event.target.id === 'item-form') {
    event.preventDefault();
    saveItem();
  }
}

function exportRaw() {
  if (persistence.raw === null || persistence.raw === undefined) {
    showToast('没有可导出的原始数据。', 'error');
    return;
  }
  try {
    const blob = new Blob([persistence.raw], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sdlc-demo-board-corrupt-raw.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('已导出原始数据；未修改 localStorage。', 'success');
  } catch (error) {
    showToast(`导出失败：${error && error.message ? error.message : '未知错误'}`, 'error');
  }
}

function overwriteCorrupt() {
  persistence.overwriteConfirmed = true;
  const ok = persistState();
  if (ok) {
    showToast('已用当前页面数据覆盖本应用 key；其他 localStorage 未改动。', 'success');
  } else {
    showToast('覆盖失败；原始数据仍保留。', 'error');
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    if (modalState) {
      event.preventDefault();
      closeModal();
    } else if (activeItemId) {
      event.preventDefault();
      closeDetail();
    }
  }
}

function init() {
  hydrateIcons();
  const loaded = loadBoardState();
  boardState = loaded.state;
  persistence = {
    mode: loaded.mode,
    raw: loaded.raw,
    message: loaded.message,
    dirty: false,
    overwriteConfirmed: false,
  };
  const hashView = String(window.location.hash || '').replace('#', '');
  activeView = ['evidence', 'guide'].includes(hashView) ? hashView : 'board';
  $$('.view').forEach((section) => { section.hidden = section.id !== `view-${activeView}`; });
  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  document.addEventListener('change', handleChange);
  document.addEventListener('submit', handleSubmit);
  document.addEventListener('keydown', handleKeydown);
  renderAll();
  document.documentElement.dataset.appReady = 'true';
  window.__SDLC_BOARD_READY__ = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
