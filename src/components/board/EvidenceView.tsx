import { ExternalLink } from 'lucide-react'
import { EVIDENCE_SNAPSHOT, type CapabilityStage } from '@/board/evidence'

const toneClass: Record<CapabilityStage['tone'], string> = {
  passed: 'border-emerald-600/20 bg-emerald-50 text-emerald-700',
  generated: 'border-amber-500/30 bg-amber-100 text-charcoal-800',
  future: 'border-charcoal-900/10 bg-white text-charcoal-500',
  pending: 'border-charcoal-900/10 bg-rice-200 text-charcoal-700',
}

const tagClass: Record<string, string> = {
  real: 'border-emerald-600/20 bg-emerald-50 text-emerald-700',
  pending: 'border-charcoal-900/10 bg-charcoal-900/5 text-charcoal-500',
  sample: 'border-amber-500/20 bg-amber-100 text-charcoal-700',
}

const acStatusLabel: Record<string, { label: string; className: string }> = {
  covered: { label: '已覆盖', className: 'bg-emerald-50 text-emerald-700' },
  partial: { label: '部分', className: 'bg-amber-100 text-charcoal-700' },
  pending: { label: '未执行', className: 'bg-charcoal-900/5 text-charcoal-500' },
}

export function EvidenceView() {
  return (
    <section data-testid="evidence-view" className="space-y-4">
      <div className="rounded-2xl border border-charcoal-900/5 bg-white p-4">
        <h2 className="text-lg font-extrabold text-charcoal-900">能力证据</h2>
        <p className="mt-1 text-sm leading-6 text-charcoal-500">
          节点状态来自构建期静态快照，不联网读取 PR/CI/平台状态。“部分”表示实现与本地自测已落地，正式节点证据尚未回填。
        </p>
        <p className="mt-1 text-xs leading-5 text-charcoal-500">
          分支 {EVIDENCE_SNAPSHOT.branch} · 基线 {EVIDENCE_SNAPSHOT.baseCommit.slice(0, 7)} · {EVIDENCE_SNAPSHOT.commitNote}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {EVIDENCE_SNAPSHOT.stages.map((stage) => (
          <article key={stage.index} data-testid="stage-card" data-index={stage.index} className="rounded-2xl border border-charcoal-900/5 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold tracking-widest text-charcoal-500">NODE {stage.index}</p>
                <h3 className="mt-0.5 text-base font-bold text-charcoal-900">{stage.name}</h3>
              </div>
              <span data-testid="stage-status" className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-bold ${toneClass[stage.tone]}`}>{stage.statusLabel}</span>
            </div>
            <ul className="mt-3 space-y-2">
              {stage.items.map((item) => (
                <li key={item.label} className="rounded-xl bg-rice-50 px-2.5 py-2">
                  <div className="flex flex-wrap items-start justify-between gap-1.5">
                    <span className="text-xs font-bold text-charcoal-900">{item.label}</span>
                    <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${tagClass[item.tag]}`}>{item.status}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-charcoal-500">{item.detail}</p>
                  {item.href && (
                    <a href={item.href} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-chili-600 underline decoration-chili-500/30 underline-offset-2">
                      打开产物<ExternalLink size={11} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-charcoal-900/5 bg-white p-4">
        <h2 className="text-lg font-extrabold text-charcoal-900">AC-01..AC-12 追溯</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-charcoal-900/10 text-charcoal-500">
                <th className="py-2 pr-3 font-bold">编号</th>
                <th className="py-2 pr-3 font-bold">验收点</th>
                <th className="py-2 pr-3 font-bold">状态</th>
                <th className="py-2 font-bold">说明</th>
              </tr>
            </thead>
            <tbody>
              {EVIDENCE_SNAPSHOT.acRows.map((row) => {
                const meta = acStatusLabel[row.status]
                return (
                  <tr key={row.id} data-testid={`ac-row-${row.id}`} className="border-b border-charcoal-900/5 align-top">
                    <td className="py-2 pr-3 font-bold text-charcoal-900">{row.id}</td>
                    <td className="py-2 pr-3 text-charcoal-700">{row.name}</td>
                    <td className="py-2 pr-3"><span className={`rounded-full px-2 py-0.5 font-bold ${meta.className}`}>{meta.label}</span></td>
                    <td className="py-2 text-charcoal-500">{row.note}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-charcoal-900/5 bg-white p-4">
        <h2 className="text-lg font-extrabold text-charcoal-900">尚未执行的项</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-charcoal-600">
          {EVIDENCE_SNAPSHOT.pendingItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </section>
  )
}
