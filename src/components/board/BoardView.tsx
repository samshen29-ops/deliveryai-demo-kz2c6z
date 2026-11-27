import { AlertTriangle, ExternalLink, Plus, RotateCcw, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { COPY } from '@/board/copy'
import { PRIORITIES, STATUS_META, STATUSES, TITLE_MAX, TYPE_LABELS } from '@/board/model'
import { describeFilters, statusPercent } from '@/board/query'
import { useBoard } from '@/board/useBoard'
import { BoardColumns } from './BoardColumns'
import { EvidenceView } from './EvidenceView'
import { GuideView } from './GuideView'
import { ItemDetail } from './ItemDetail'
import { ItemFormDialog } from './ItemFormDialog'
import { ResetDialog } from './ResetDialog'

interface BoardViewProps {
  onExit: () => void
}

const statTone: Record<string, string> = {
  plan: 'text-charcoal-700',
  progress: 'text-amber-500',
  review: 'text-chili-500',
  blocked: 'text-charcoal-900',
  done: 'text-emerald-600',
}

export function BoardView({ onExit }: BoardViewProps) {
  const api = useBoard()
  const { stats, filters } = api

  const storageTitle = api.mode === 'corrupt'
    ? '本地数据无法安全读取，当前显示合成种子数据'
    : api.mode === 'write-error'
      ? '保存失败，改动仅在本次页面保留'
      : api.mode === 'unavailable'
        ? '浏览器存储不可用，改动仅在本次页面保留'
        : '改动尚未写入本地存储'

  return (
    <div className="min-h-screen bg-rice-100 paper-noise text-charcoal-900" data-testid="board-root">
      <header className="sticky top-0 z-30 border-b border-charcoal-900/5 bg-rice-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold tracking-[0.18em] text-chili-500">{COPY.appSubtitle}</p>
            <h1 className="text-lg font-extrabold leading-6 text-charcoal-900 sm:text-xl">{COPY.appTitle}</h1>
          </div>
          <nav aria-label="看板视图" className="flex items-center gap-1 rounded-xl bg-rice-200/70 p-1">
            {([
              ['board', COPY.navBoard, 'nav-board'],
              ['evidence', COPY.navEvidence, 'nav-evidence'],
              ['guide', COPY.navGuide, 'nav-guide'],
            ] as const).map(([view, label, testId]) => (
              <button
                key={view}
                type="button"
                data-testid={testId}
                aria-current={api.view === view ? 'page' : undefined}
                onClick={() => api.setView(view)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition sm:px-3 ${api.view === view ? 'bg-white text-chili-600 shadow-sm' : 'text-charcoal-600 hover:text-charcoal-900'}`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button type="button" onClick={onExit} className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold text-charcoal-600 hover:bg-rice-200" data-testid="go-hotpot">
              {COPY.hotpotLink}<ExternalLink size={12} />
            </button>
            <button type="button" onClick={api.openReset} data-testid="open-reset" className="inline-flex items-center gap-1.5 rounded-xl border border-charcoal-900/10 bg-white px-2.5 py-2 text-xs font-bold text-charcoal-700 hover:bg-rice-100">
              <RotateCcw size={14} />{COPY.reset}
            </button>
            <button type="button" onClick={api.openCreate} data-testid="open-create" className="inline-flex items-center gap-1.5 rounded-xl bg-chili-500 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-chili-600">
              <Plus size={15} />{COPY.newItem}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-3 py-3 sm:px-5 sm:py-4">
        <div data-testid="synthetic-banner" className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-100/70 px-3 py-2 text-xs leading-5 text-charcoal-700">
          <span className="rounded-full bg-chili-500 px-2 py-0.5 text-[11px] font-extrabold text-white">{COPY.syntheticBadge}</span>
          <span>{COPY.syntheticNote}</span>
        </div>

        {((api.mode !== 'ok' && api.mode !== 'empty') || api.dirty) && (
          <div data-testid="storage-banner" className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl border border-chili-500/20 bg-chili-50 px-3 py-2 text-xs text-chili-700">
            <AlertTriangle size={16} className="shrink-0" />
            <div className="min-w-0 flex-1">
              <strong className="font-bold">{storageTitle}</strong>
              <span className="ml-1 break-words">{api.storageMessage}{api.mode === 'corrupt' ? ' 在你确认前，不会删除或覆盖原始内容。' : ''}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {api.mode === 'corrupt' && api.raw !== null && (
                <button type="button" data-testid="export-raw" onClick={api.exportCorruptRaw} className="rounded-lg border border-chili-500/30 bg-white px-2 py-1 font-bold">{COPY.exportRaw}</button>
              )}
              {api.mode === 'corrupt' && (
                <button type="button" data-testid="overwrite-corrupt" onClick={api.overwriteCorrupt} className="rounded-lg bg-chili-600 px-2 py-1 font-bold text-white">{COPY.overwriteCorrupt}</button>
              )}
              {(api.mode === 'write-error' || api.mode === 'unavailable') && (
                <button type="button" data-testid="retry-save" onClick={api.retrySave} className="rounded-lg border border-chili-500/30 bg-white px-2 py-1 font-bold">{COPY.retrySave}</button>
              )}
            </div>
          </div>
        )}

        {api.view === 'board' && (
          <div className="mt-3 space-y-3" data-testid="board-view">
            <section aria-label="总览统计" className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
              <div className="rounded-2xl border border-charcoal-900/5 bg-white p-3">
                <p className="text-[11px] font-bold text-charcoal-500">当前筛选总数</p>
                <p data-testid="stat-total" className="mt-1 text-2xl font-extrabold leading-7 text-charcoal-900">{stats.total}</p>
                <p className="mt-0.5 text-[10px] text-charcoal-500">全量 {api.board.items.length} 条 · 当前 {stats.total} 条</p>
              </div>
              {STATUS_META.map((status) => {
                const count = stats.counts[status.value]
                const percent = statusPercent(count, stats.total)
                return (
                  <div key={status.value} className="rounded-2xl border border-charcoal-900/5 bg-white p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-charcoal-500"><i aria-hidden="true" className="h-2 w-2 rounded-full bg-current opacity-60" />{status.label}</p>
                    <p data-testid={`stat-${status.key}`} className={`mt-1 text-2xl font-extrabold leading-7 ${statTone[status.key]}`}>{count}</p>
                    <p className="mt-0.5 text-[10px] text-charcoal-500">占当前集合 {percent === null ? '无数据' : `${percent}%`}</p>
                  </div>
                )
              })}
              <div className="rounded-2xl border border-charcoal-900/5 bg-white p-3">
                <p className="text-[11px] font-bold text-charcoal-500">完成率</p>
                <p data-testid="stat-completion" className="mt-1 text-2xl font-extrabold leading-7 text-emerald-600">{stats.rate === null ? '无数据' : `${stats.rate}%`}</p>
                <p className="mt-0.5 text-[10px] text-charcoal-500">{stats.total === 0 ? '当前筛选集合为空' : `${stats.completed} / ${stats.total} 已完成`}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-rice-200" aria-hidden="true">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${stats.rate ?? 0}%` }} />
                </div>
              </div>
            </section>

            <section aria-label="筛选" className="rounded-2xl border border-charcoal-900/5 bg-white p-3">
              <div className="flex flex-wrap items-end gap-2">
                <label className="min-w-[180px] flex-1 text-[11px] font-bold text-charcoal-600">
                  {COPY.searchLabel}
                  <span className="relative mt-1 block">
                    <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal-500" />
                    <input
                      type="search"
                      value={filters.q}
                      onChange={(event) => api.updateFilters({ q: event.target.value })}
                      placeholder={COPY.searchPlaceholder}
                      data-testid="search-input"
                      className="w-full rounded-xl border border-charcoal-900/10 bg-rice-50 py-2 pl-8 pr-2 text-sm text-charcoal-900 outline-none focus:ring-2 focus:ring-chili-500"
                    />
                  </span>
                </label>
                <label className="text-[11px] font-bold text-charcoal-600">
                  {COPY.typeLabel}
                  <select value={filters.type} onChange={(event) => api.updateFilters({ type: event.target.value as typeof filters.type })} data-testid="filter-type" className="mt-1 block rounded-xl border border-charcoal-900/10 bg-rice-50 px-2.5 py-2 text-sm font-semibold text-charcoal-900 outline-none focus:ring-2 focus:ring-chili-500">
                    <option value="all">{COPY.all}</option>
                    {(['requirement', 'defect'] as const).map((type) => <option key={type} value={type}>{TYPE_LABELS[type]}</option>)}
                  </select>
                </label>
                <label className="text-[11px] font-bold text-charcoal-600">
                  {COPY.priorityLabel}
                  <select value={filters.priority} onChange={(event) => api.updateFilters({ priority: event.target.value as typeof filters.priority })} data-testid="filter-priority" className="mt-1 block rounded-xl border border-charcoal-900/10 bg-rice-50 px-2.5 py-2 text-sm font-semibold text-charcoal-900 outline-none focus:ring-2 focus:ring-chili-500">
                    <option value="all">{COPY.all}</option>
                    {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                  </select>
                </label>
                <label className="text-[11px] font-bold text-charcoal-600">
                  {COPY.statusFilterLabel}
                  <select value={filters.status} onChange={(event) => api.updateFilters({ status: event.target.value as typeof filters.status })} data-testid="filter-status" className="mt-1 block rounded-xl border border-charcoal-900/10 bg-rice-50 px-2.5 py-2 text-sm font-semibold text-charcoal-900 outline-none focus:ring-2 focus:ring-chili-500">
                    <option value="all">{COPY.all}</option>
                    {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <button type="button" onClick={api.clearFilters} data-testid="clear-filters" className="inline-flex items-center gap-1.5 rounded-xl border border-charcoal-900/10 bg-white px-3 py-2 text-xs font-bold text-charcoal-700 hover:bg-rice-100">
                  <SlidersHorizontal size={14} />{COPY.clearFilters}
                </button>
              </div>
              <p data-testid="filter-summary" className="mt-2 text-[11px] text-charcoal-500">
                当前显示 <strong className="text-charcoal-900">{api.filteredItems.length}</strong> / {api.board.items.length} 条 · {describeFilters(filters)}
              </p>
            </section>

            {api.filteredItems.length === 0 ? (
              <section data-testid="empty-state" className="rounded-2xl border border-dashed border-charcoal-900/15 bg-white px-4 py-10 text-center">
                <ShieldCheck size={30} className="mx-auto text-charcoal-500" />
                <h2 className="mt-2 text-base font-extrabold text-charcoal-900">{COPY.emptyTitle}</h2>
                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-charcoal-500">{COPY.emptyBody}</p>
                <button type="button" onClick={api.clearFilters} data-testid="empty-clear" className="mt-3 rounded-xl bg-chili-500 px-4 py-2 text-sm font-bold text-white">{COPY.clearFiltersShort}</button>
              </section>
            ) : (
              <BoardColumns items={api.filteredItems} stats={stats} onOpen={api.openDetail} />
            )}
          </div>
        )}

        {api.view === 'evidence' && <div className="mt-3"><EvidenceView /></div>}
        {api.view === 'guide' && <div className="mt-3"><GuideView onOpenCreate={api.openCreate} onGoEvidence={() => api.setView('evidence')} /></div>}

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-charcoal-900/5 py-3 text-[11px] text-charcoal-500">
          <span>标题上限 {TITLE_MAX} 字符 · 数据保存在浏览器 key <code className="rounded bg-white px-1">sdlc-demo-board:v1</code> · 复位只影响本应用</span>
          <span>本页不是公开发布，也不代表平台流程已全部执行。</span>
        </footer>
      </main>

      <ItemFormDialog
        open={api.formOpen}
        mode={api.editingItem ? 'edit' : 'create'}
        initial={api.editingItem}
        onCancel={api.closeForm}
        onSubmit={(draft) => api.saveDraft(draft, api.editingItem?.id)}
      />

      {api.selectedItem && (
        <ItemDetail
          item={api.selectedItem}
          open
          onClose={api.closeDetail}
          onEdit={api.openEdit}
          onTransition={api.transition}
          transitionNotice={api.transitionNotice}
        />
      )}

      <ResetDialog
        open={api.resetOpen}
        step={api.resetStep}
        onCancel={api.cancelReset}
        onContinue={api.continueReset}
        onConfirm={api.confirmReset}
      />

      {api.toast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="toast"
          className={`fixed bottom-4 left-1/2 z-[60] max-w-[92vw] -translate-x-1/2 rounded-full px-4 py-2 text-xs font-bold shadow-float ${api.toast.kind === 'error' ? 'bg-chili-600 text-white' : 'bg-charcoal-900 text-white'}`}
        >
          {api.toast.message}
        </div>
      )}
    </div>
  )
}
