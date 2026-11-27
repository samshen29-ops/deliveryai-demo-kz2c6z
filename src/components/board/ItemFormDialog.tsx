import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ASSIGNEES, PRIORITIES, TEXT_MAX, TITLE_MAX, type WorkItem } from '@/board/model'
import { countChars, normalizeDraft, validateDraft, type FieldErrors, type WorkItemDraft } from '@/board/rules'
import { COPY } from '@/board/copy'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface ItemFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initial?: WorkItem | null
  onCancel: () => void
  onSubmit: (draft: WorkItemDraft) => FieldErrors
}

const EMPTY_DRAFT: WorkItemDraft = {
  type: 'requirement',
  title: '',
  description: '',
  priority: 'P2',
  assignee: '示例产品',
  acceptance: '',
}

const FIELD_ORDER: (keyof WorkItemDraft)[] = ['type', 'title', 'priority', 'assignee', 'description', 'acceptance']

export function ItemFormDialog({ open, mode, initial, onCancel, onSubmit }: ItemFormDialogProps) {
  const [draft, setDraft] = useState<WorkItemDraft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<FieldErrors>({})
  const refs = useRef<Partial<Record<keyof WorkItemDraft, HTMLElement | null>>>({})

  useEffect(() => {
    if (!open) return
    setDraft(initial
      ? {
          type: initial.type,
          title: initial.title,
          description: initial.description,
          priority: initial.priority,
          assignee: initial.assignee,
          acceptance: initial.acceptance,
        }
      : { ...EMPTY_DRAFT })
    setErrors({})
  }, [open, mode, initial])

  const setField = <K extends keyof WorkItemDraft>(field: K, value: WorkItemDraft[K]) => {
    setDraft((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => {
      if (!previous[field]) return previous
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  const focusFirstError = (nextErrors: FieldErrors) => {
    const first = FIELD_ORDER.find((field) => nextErrors[field])
    if (first) refs.current[first]?.focus()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = normalizeDraft(draft)
    const clientErrors = validateDraft(normalized)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      focusFirstError(clientErrors)
      return
    }
    const parentErrors = onSubmit(normalized)
    if (parentErrors && Object.keys(parentErrors).length > 0) {
      setErrors(parentErrors)
      focusFirstError(parentErrors)
    }
  }

  const error = (field: keyof WorkItemDraft) => errors[field]
  const describedBy = (field: keyof WorkItemDraft, extra?: string) =>
    [error(field) ? `error-${field}` : '', extra ?? ''].filter(Boolean).join(' ') || undefined

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel() }}>
      <DialogContent title={mode === 'edit' ? COPY.formEditTitle : COPY.formCreateTitle} className="md:max-w-2xl">
        <p className="mt-2 text-sm leading-6 text-charcoal-500">
          {mode === 'edit'
            ? '保存后保留原状态、历史和证据；取消不会写入任何修改。'
            : '新工作项默认进入待规划。保存后写入本应用 localStorage，不调用后端。'}
        </p>
        <form noValidate data-testid="item-form" onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <fieldset className="md:col-span-2">
            <legend className="mb-2 text-sm font-bold text-charcoal-900">类型</legend>
            <div className="flex gap-2">
              {([['requirement', '需求'], ['defect', '缺陷']] as const).map(([value, label]) => (
                <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${draft.type === value ? 'border-chili-500 bg-chili-50 text-chili-600' : 'border-charcoal-900/10 bg-white text-charcoal-700'}`}>
                  <input
                    ref={(element) => { if (value === 'requirement') refs.current.type = element }}
                    type="radio"
                    name="type"
                    value={value}
                    checked={draft.type === value}
                    onChange={() => setField('type', value)}
                    data-testid={`type-${value}`}
                    aria-invalid={error('type') ? true : undefined}
                    aria-describedby={describedBy('type')}
                  />
                  {label}
                </label>
              ))}
            </div>
            {error('type') && <p id="error-type" role="alert" className="mt-1 text-xs font-semibold text-chili-600">{error('type')}</p>}
          </fieldset>

          <div className="md:col-span-2">
            <label htmlFor="item-title" className="flex items-center justify-between text-sm font-bold text-charcoal-900">
              <span>标题 <span className="text-chili-500">*</span></span>
              <span className="text-xs font-normal text-charcoal-500" data-testid="title-counter">{countChars(draft.title)} / {TITLE_MAX}</span>
            </label>
            <input
              ref={(element) => { refs.current.title = element }}
              id="item-title"
              name="title"
              type="text"
              value={draft.title}
              onChange={(event) => setField('title', event.target.value)}
              placeholder="例如：筛选条件记忆"
              autoComplete="off"
              data-testid="title-input"
              aria-invalid={error('title') ? true : undefined}
              aria-describedby={describedBy('title', 'title-help')}
              className={`mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-charcoal-900 outline-none focus:ring-2 focus:ring-chili-500 ${error('title') ? 'border-chili-500' : 'border-charcoal-900/10'}`}
            />
            <p id="title-help" className="mt-1 text-xs text-charcoal-500">必填；保存时去除前后空格，按 Unicode 字符计 1–{TITLE_MAX}。</p>
            {error('title') && <p id="error-title" role="alert" data-testid="form-error-title" className="mt-1 text-xs font-semibold text-chili-600">{error('title')}</p>}
          </div>

          <div>
            <label htmlFor="item-priority" className="text-sm font-bold text-charcoal-900">优先级</label>
            <select
              ref={(element) => { refs.current.priority = element }}
              id="item-priority"
              name="priority"
              value={draft.priority}
              onChange={(event) => setField('priority', event.target.value)}
              data-testid="priority-input"
              aria-invalid={error('priority') ? true : undefined}
              aria-describedby={describedBy('priority')}
              className="mt-1.5 w-full rounded-xl border border-charcoal-900/10 bg-white px-3 py-2.5 text-sm text-charcoal-900 outline-none focus:ring-2 focus:ring-chili-500"
            >
              {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
            {error('priority') && <p id="error-priority" role="alert" className="mt-1 text-xs font-semibold text-chili-600">{error('priority')}</p>}
          </div>

          <div>
            <label htmlFor="item-assignee" className="text-sm font-bold text-charcoal-900">示例负责人</label>
            <select
              ref={(element) => { refs.current.assignee = element }}
              id="item-assignee"
              name="assignee"
              value={draft.assignee}
              onChange={(event) => setField('assignee', event.target.value)}
              data-testid="assignee-input"
              aria-invalid={error('assignee') ? true : undefined}
              aria-describedby={describedBy('assignee')}
              className="mt-1.5 w-full rounded-xl border border-charcoal-900/10 bg-white px-3 py-2.5 text-sm text-charcoal-900 outline-none focus:ring-2 focus:ring-chili-500"
            >
              {ASSIGNEES.map((assignee) => <option key={assignee} value={assignee}>{assignee}</option>)}
            </select>
            {error('assignee') && <p id="error-assignee" role="alert" className="mt-1 text-xs font-semibold text-chili-600">{error('assignee')}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="item-description" className="flex items-center justify-between text-sm font-bold text-charcoal-900">
              <span>描述</span>
              <span className="text-xs font-normal text-charcoal-500" data-testid="description-counter">{countChars(draft.description)} / {TEXT_MAX}</span>
            </label>
            <textarea
              ref={(element) => { refs.current.description = element }}
              id="item-description"
              name="description"
              value={draft.description}
              onChange={(event) => setField('description', event.target.value)}
              placeholder="补充业务背景、复现步骤或边界。内容会作为纯文本显示。"
              data-testid="description-input"
              aria-invalid={error('description') ? true : undefined}
              aria-describedby={describedBy('description')}
              rows={3}
              className={`mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-charcoal-900 outline-none focus:ring-2 focus:ring-chili-500 ${error('description') ? 'border-chili-500' : 'border-charcoal-900/10'}`}
            />
            {error('description') && <p id="error-description" role="alert" data-testid="form-error-description" className="mt-1 text-xs font-semibold text-chili-600">{error('description')}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="item-acceptance" className="flex items-center justify-between text-sm font-bold text-charcoal-900">
              <span>验收说明</span>
              <span className="text-xs font-normal text-charcoal-500" data-testid="acceptance-counter">{countChars(draft.acceptance)} / {TEXT_MAX}</span>
            </label>
            <textarea
              ref={(element) => { refs.current.acceptance = element }}
              id="item-acceptance"
              name="acceptance"
              value={draft.acceptance}
              onChange={(event) => setField('acceptance', event.target.value)}
              placeholder={'每行一条验收清单，例如：\n刷新后保留修改\n非法流转被拒绝'}
              data-testid="acceptance-input"
              aria-invalid={error('acceptance') ? true : undefined}
              aria-describedby={describedBy('acceptance', 'acceptance-help')}
              rows={3}
              className={`mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-charcoal-900 outline-none focus:ring-2 focus:ring-chili-500 ${error('acceptance') ? 'border-chili-500' : 'border-charcoal-900/10'}`}
            />
            <p id="acceptance-help" className="mt-1 text-xs text-charcoal-500">可选；最多 {TEXT_MAX} 字符；每行会显示为一条验收清单。</p>
            {error('acceptance') && <p id="error-acceptance" role="alert" className="mt-1 text-xs font-semibold text-chili-600">{error('acceptance')}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 md:col-span-2">
            <button type="button" onClick={onCancel} data-testid="cancel-item" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-charcoal-700 hover:bg-rice-200">
              {COPY.cancel}
            </button>
            <button type="submit" data-testid="save-item" className="rounded-xl bg-chili-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-chili-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili-500">
              {mode === 'edit' ? COPY.saveEdit : COPY.saveCreate}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
