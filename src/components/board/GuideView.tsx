import { Check, ExternalLink } from 'lucide-react'
import { COPY } from '@/board/copy'

export function GuideView({ onOpenCreate, onGoEvidence }: { onOpenCreate: () => void; onGoEvidence: () => void }) {
  return (
    <section data-testid="guide-view" className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-charcoal-900/5 bg-white p-4">
        <h2 className="text-lg font-extrabold text-charcoal-900">5 分钟演示步骤</h2>
        <ol className="mt-3 space-y-3">
          {COPY.guideSteps.map(([title, description], index) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-chili-50 text-xs font-extrabold text-chili-600">{index + 1}</span>
              <div><h3 className="text-sm font-bold text-charcoal-900">{title}</h3><p className="mt-0.5 text-xs leading-5 text-charcoal-500">{description}</p></div>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onOpenCreate} className="rounded-xl bg-chili-500 px-3 py-2 text-xs font-bold text-white hover:bg-chili-600">现在新增一条</button>
          <button type="button" onClick={onGoEvidence} className="rounded-xl border border-charcoal-900/10 bg-white px-3 py-2 text-xs font-bold text-charcoal-700 hover:bg-rice-100">查看能力证据</button>
          <a href="docs/prd/requirements-defect-board.md" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-charcoal-700 hover:bg-rice-100">打开 PRD<ExternalLink size={12} /></a>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-charcoal-900/5 bg-white p-4">
          <h2 className="text-lg font-extrabold text-charcoal-900">四角色分工</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {COPY.roles.map(([role, duty]) => (
              <div key={role} className="rounded-xl bg-rice-50 px-3 py-2">
                <strong className="text-xs font-bold text-charcoal-900">{role}</strong>
                <p className="mt-0.5 text-[11px] leading-5 text-charcoal-500">{duty}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-charcoal-900/5 bg-white p-4">
          <h2 className="text-lg font-extrabold text-charcoal-900">边界与真实性</h2>
          <ul className="mt-3 space-y-2">
            {COPY.boundaries.map((text) => (
              <li key={text} className="flex gap-2 text-xs leading-5 text-charcoal-600"><Check size={15} className="mt-0.5 shrink-0 text-emerald-600" />{text}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
