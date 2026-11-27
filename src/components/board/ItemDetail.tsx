import { useEffect, useRef, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ArrowRight, Check, FileText, History, ListChecks, Lock, Pencil, X } from 'lucide-react'
import {
  STATUS_META,
  TYPE_LABELS,
  formatDate,
  formatFullDate,
  type Evidence,
  type Status,
  type WorkItem,
} from '@/board/model'
import { allowedTargets, allOtherStatuses } from '@/board/rules'
import { EVIDENCE_SNAPSHOT } from '@/board/evidence'
import { COPY } from '@/board/copy'

interface ItemDetailProps {
  item: WorkItem
  open: boolean
  onClose: () => void
  onEdit: (id: string) => void
  onTransition: (id: string, target: Status) => void
  transitionNotice: string | null
}

function statusPill(status: Status) {
  const meta = STATUS_META.find((candidate) => candidate.value === status)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold status-${meta?.key ?? 'plan'} bg-rice-200 text-charcoal-700`}>
      <i aria-hidden="true" className="h-2 w-2 rounded-full bg-current opacity-70" />
      {status}
    </span>
  )
}

function evidenceLabel(kind: Evidence['kind']): { label: string; className: string } {
  if (kind === 'real') return { label: '本轮真实产物', className: 'bg-emerald-50 text-emerald-700 border border-emerald-600/20' }
  if (kind === 'pending') return { label: '未执行/待确认', className: 'bg-charcoal-900/5 text-charcoal-500 border border-charcoal-900/10' }
  return { label: '示例记录', className: 'bg-amber-100 text-charcoal-700 border border-amber-500/20' }
}

export function ItemDetail({ item, open, onClose, onEdit, onTransition, transitionNotice }: ItemDetailProps) {
  const allowed = allowedTargets(item.status)
  const targets = [...allowed, ...allOtherStatuses(item.status).filter((status) => !allowed.includes(status))]
  const [target, setTarget] = useState<Status>(allowed[0] ?? targets[0])
  const alertRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setTarget(allowed[0] ?? targets[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.status])

  useEffect(() => {
    if (transitionNotice) alertRef.current?.focus()
  }, [transitionNotice])

  const done = item.status === '已完成'
  const acceptanceItems = item.acceptance.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const history = item.history
    .map((event, index) => ({ event, index }))
    .sort((a, b) => b.event.at.localeCompare(a.event.at) || a.index - b.index)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-charcoal-900/40 backdrop-blur-sm data-[state=open]:animate-rise" />
        <DialogPrimitive.Content
          data-testid="detail-drawer"
          className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-charcoal-900/10 bg-rice-50 p-5 shadow-float focus:outline-none sm:p-6"
        >
          <DialogPrimitive.Title data-testid="detail-title" className="pr-12 text-xl font-extrabold leading-8 text-charcoal-900">{item.title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">工作项 {item.id} 详情</DialogPrimitive.Description>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span data-testid="detail-id" className="font-semibold text-charcoal-500">{item.id}</span>
            <span className={`rounded-md px-2 py-1 font-bold ${item.type === 'defect' ? 'bg-chili-50 text-chili-600' : 'bg-rice-200 text-charcoal-700'}`}>{TYPE_LABELS[item.type]}</span>
            <span className="rounded-md bg-white px-2 py-1 font-bold text-charcoal-700 shadow-sm">{item.priority}</span>
            {statusPill(item.status)}
            <span className="rounded-full bg-white px-2 py-1 font-semibold text-charcoal-700 shadow-sm">{item.assignee}</span>
          </div>

          <DialogPrimitive.Close
            data-testid="close-detail"
            aria-label="关闭详情"
            className="absolute right-4 top-4 rounded-full bg-white p-2 text-charcoal-500 shadow-sm transition hover:text-chili-500"
          >
            <X size={18} />
          </DialogPrimitive.Close>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {done
              ? <span data-testid="readonly-note" className="inline-flex items-center gap-2 rounded-xl bg-rice-200 px-3 py-2 text-xs font-semibold text-charcoal-700"><Lock size={14} />{COPY.readonly}，不会自动重开</span>
              : <button type="button" data-testid="edit-item" onClick={() => onEdit(item.id)} className="inline-flex items-center gap-2 rounded-xl bg-chili-500 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-chili-600"><Pencil size={14} />编辑工作项</button>}
          </div>

          <section className="mt-5 rounded-2xl border border-charcoal-900/5 bg-white p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-charcoal-900"><FileText size={15} />{COPY.detailBusiness}</h3>
            <p data-testid="detail-description" className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-charcoal-700">
              {item.description || <span className="text-charcoal-500">未填写描述。</span>}
            </p>
          </section>

          <section className="mt-3 rounded-2xl border border-charcoal-900/5 bg-white p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-charcoal-900"><ListChecks size={15} />{COPY.detailAcceptance}</h3>
            {acceptanceItems.length > 0
              ? <ul className="mt-2 space-y-1.5 text-sm leading-6 text-charcoal-700">{acceptanceItems.map((line) => <li key={line} className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-emerald-600" /><span className="break-words">{line}</span></li>)}</ul>
              : <p className="mt-2 text-sm text-charcoal-500">未填写验收说明。</p>}
          </section>

          <section className="mt-3 rounded-2xl border border-charcoal-900/5 bg-white p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-charcoal-900"><ArrowRight size={15} />{COPY.detailTransition}</h3>
            {done
              ? <p className="mt-2 rounded-xl bg-rice-100 px-3 py-3 text-sm leading-6 text-charcoal-700">已完成工作项只读。不会提供编辑或状态流转入口，也不会自动重开。如需继续处理，请新建工作项。</p>
              : (
                <div className="mt-2">
                  <div className="flex flex-wrap items-end gap-2">
                    <label htmlFor="transition-select" className="text-xs font-semibold text-charcoal-700">
                      {COPY.transitionTarget}
                      <select
                        id="transition-select"
                        data-testid="transition-select"
                        value={target}
                        onChange={(event) => setTarget(event.target.value as Status)}
                        className="mt-1 block rounded-xl border border-charcoal-900/10 bg-white px-3 py-2 text-sm font-semibold text-charcoal-900 outline-none focus:ring-2 focus:ring-chili-500"
                      >
                        {targets.map((status) => (
                          <option key={status} value={status}>{allowed.includes(status) ? `${status}（允许）` : status}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      data-testid="transition-submit"
                      onClick={() => onTransition(item.id, target)}
                      className="inline-flex items-center gap-2 rounded-xl bg-rice-200 px-4 py-2 text-sm font-bold text-charcoal-900 hover:bg-amber-100"
                    >
                      <ArrowRight size={15} />{COPY.transitionSubmit}
                    </button>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-charcoal-500">
                    允许的目标状态：{allowed.length ? allowed.map((status) => `「${status}」`).join('、') : '无'}。非法目标会被拒绝并写入拒绝历史。
                  </p>
                  {transitionNotice && (
                    <div ref={alertRef} tabIndex={-1} role="alert" data-testid="transition-alert" className="mt-2 rounded-xl border border-chili-500/20 bg-chili-50 px-3 py-2 text-xs font-semibold leading-5 text-chili-700 outline-none">
                      {transitionNotice}
                    </div>
                  )}
                </div>
              )}
          </section>

          <section className="mt-3 rounded-2xl border border-charcoal-900/5 bg-white p-4" data-testid="detail-history">
            <h3 className="flex items-center gap-2 text-sm font-bold text-charcoal-900"><History size={15} />{COPY.detailHistory}</h3>
            <ol className="mt-2 space-y-2">
              {history.length === 0 && <li className="text-sm text-charcoal-500">暂无历史记录。</li>}
              {history.map(({ event }) => (
                <li key={event.id} data-testid="history-event" className={`rounded-xl border px-3 py-2 ${event.result === 'rejected' ? 'border-chili-500/20 bg-chili-50' : 'border-charcoal-900/5 bg-rice-50'}`}>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-charcoal-900">
                    <span>{event.from ? `「${event.from}」` : '创建'} → 「{event.to}」</span>
                    <span data-testid="history-result" className={`rounded-md px-1.5 py-0.5 ${event.result === 'rejected' ? 'bg-chili-100 text-chili-700' : 'bg-emerald-50 text-emerald-700'}`}>{event.result === 'rejected' ? '拒绝' : '成功'}</span>
                    <span className="font-normal text-charcoal-500">{formatDate(event.at)}</span>
                  </div>
                  <p className="mt-1 break-words text-xs leading-5 text-charcoal-600">{event.reason} · {event.actor}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-3 rounded-2xl border border-charcoal-900/5 bg-white p-4" data-testid="detail-evidence">
            <h3 className="flex items-center gap-2 text-sm font-bold text-charcoal-900"><FileText size={15} />{COPY.detailEvidence}</h3>
            <div className="mt-2 space-y-2">
              {item.evidence.length === 0 && <p className="text-sm text-charcoal-500">暂无证据记录。</p>}
              {item.evidence.map((evidence) => {
                const tag = evidenceLabel(evidence.kind)
                return (
                  <div key={evidence.id} className="rounded-xl border border-charcoal-900/5 bg-rice-50 px-3 py-2" data-testid="evidence-item">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="break-words text-xs font-bold text-charcoal-900">{evidence.title}</strong>
                      <span data-testid="evidence-tag" className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tag.className}`}>{tag.label}</span>
                    </div>
                    <p className="mt-1 break-words text-xs leading-5 text-charcoal-600">{evidence.detail}{evidence.status ? ` · 状态：${evidence.status}` : ''}</p>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 rounded-xl border border-charcoal-900/5 bg-white px-3 py-2" data-testid="detail-real-evidence">
              <h4 className="text-xs font-bold text-charcoal-900">本轮真实产物（全局，不随工作项状态变化）</h4>
              <ul className="mt-1.5 space-y-1">
                {EVIDENCE_SNAPSHOT.realArtifacts.slice(0, 6).map((artifact) => (
                  <li key={artifact.label} className="flex items-center justify-between gap-2 text-[11px]">
                    <a href={artifact.href} target="_blank" rel="noreferrer" className="truncate font-semibold text-charcoal-700 underline decoration-charcoal-900/20 underline-offset-2 hover:text-chili-600">{artifact.label}</a>
                    <span className="shrink-0 rounded-full border border-emerald-600/20 bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700">{artifact.status}</span>
                  </li>
                ))}
                <li className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-semibold text-charcoal-700">单元测试 / 真实 E2E / PR</span>
                  <span className="rounded-full border border-charcoal-900/10 bg-charcoal-900/5 px-1.5 py-0.5 font-bold text-charcoal-500">{COPY.unitPending}</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mt-3 rounded-2xl border border-charcoal-900/5 bg-white p-4">
            <h3 className="text-sm font-bold text-charcoal-900">{COPY.detailMeta}</h3>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div><dt className="text-charcoal-500">创建时间</dt><dd className="font-semibold text-charcoal-900">{formatFullDate(item.createdAt)}</dd></div>
              <div><dt className="text-charcoal-500">最近更新</dt><dd className="font-semibold text-charcoal-900">{formatFullDate(item.updatedAt)}</dd></div>
              <div><dt className="text-charcoal-500">工作项 ID</dt><dd className="font-semibold text-charcoal-900">{item.id}</dd></div>
              <div><dt className="text-charcoal-500">数据性质</dt><dd className="font-semibold text-charcoal-900">演示合成数据</dd></div>
            </dl>
          </section>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
