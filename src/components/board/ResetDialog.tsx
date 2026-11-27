import { ArrowRight, RotateCcw } from 'lucide-react'
import { COPY } from '@/board/copy'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface ResetDialogProps {
  open: boolean
  step: 1 | 2
  onCancel: () => void
  onContinue: () => void
  onConfirm: () => void
}

export function ResetDialog({ open, step, onCancel, onContinue, onConfirm }: ResetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel() }}>
      <DialogContent title={step === 1 ? COPY.resetStep1Title : COPY.resetStep2Title}>
        <div data-testid="reset-modal" data-step={step}>
          <p className="mt-2 text-sm leading-6 text-charcoal-500">
            {step === 1 ? '这个操作不会删除工作区产物，也不会触发平台 reset。' : '下一步会覆盖本应用自己的 localStorage key。'}
          </p>
          {step === 1 ? (
            <>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-charcoal-700">
                <li>仅重置本应用 key <code className="rounded bg-rice-200 px-1 py-0.5 text-xs font-bold">sdlc-demo-board:v1</code> 为 12 条合成种子。</li>
                <li>不会清空其他 localStorage key，也不会影响 PRD、原型或 Git 分支。</li>
                <li>这不是产品空间、平台任务或 Git 的 reset。</li>
              </ul>
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-100/70 px-3 py-2 text-xs leading-5 text-charcoal-700">
                如果本应用数据已损坏，复位会用合成种子覆盖本应用 key；其他数据保持不变。
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" data-testid="reset-cancel" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-charcoal-700 hover:bg-rice-200">{COPY.resetCancel}</button>
                <button type="button" data-testid="reset-continue" onClick={onContinue} className="inline-flex items-center gap-2 rounded-xl bg-chili-500 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-chili-600">
                  <RotateCcw size={15} />{COPY.resetContinue}<ArrowRight size={15} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-chili-500/20 bg-chili-50 px-3 py-3 text-sm leading-6 text-chili-700">
                <RotateCcw size={18} className="mt-0.5 shrink-0" />
                <span>确认后将立即恢复 12 条合成工作项，并清空当前筛选。这个操作不可撤销，但只影响本应用 key。</span>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" data-testid="reset-cancel" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-charcoal-700 hover:bg-rice-200">{COPY.resetCancel}</button>
                <button type="button" data-testid="reset-confirm" onClick={onConfirm} className="rounded-xl bg-chili-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-chili-700">{COPY.resetConfirm}</button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
