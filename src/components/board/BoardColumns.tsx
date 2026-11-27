import { FileText } from 'lucide-react'
import { STATUS_META, TYPE_LABELS, type Status, type WorkItem } from '@/board/model'
import type { BoardStats } from '@/board/query'

interface BoardColumnsProps {
  items: WorkItem[]
  stats: BoardStats
  onOpen: (id: string) => void
}

const columnAccent: Record<Status, string> = {
  待规划: 'bg-charcoal-500',
  进行中: 'bg-amber-500',
  审核中: 'bg-chili-500',
  阻塞中: 'bg-charcoal-900',
  已完成: 'bg-emerald-600',
}

function Card({ item, onOpen }: { item: WorkItem; onOpen: (id: string) => void }) {
  const description = item.description || '未填写描述'
  return (
    <button
      type="button"
      data-testid="item-card"
      data-id={item.id}
      data-status={item.status}
      aria-label={`打开 ${item.id} ${item.title} 详情`}
      onClick={() => onOpen(item.id)}
      className="group w-full rounded-2xl border border-charcoal-900/10 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-chili-500/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chili-500"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${item.type === 'defect' ? 'bg-chili-50 text-chili-600' : 'bg-rice-200 text-charcoal-700'}`}>
            {TYPE_LABELS[item.type]}
          </span>
          <span className="rounded-md bg-rice-100 px-1.5 py-0.5 text-[11px] font-bold text-charcoal-700">{item.priority}</span>
        </span>
        <span className="text-[11px] font-semibold text-charcoal-500">{item.id}</span>
      </span>
      <span className="mt-2 block line-clamp-2 text-sm font-bold leading-5 text-charcoal-900">{item.title}</span>
      <span className="mt-1.5 block line-clamp-2 text-xs leading-5 text-charcoal-500">{description}</span>
      <span className="mt-3 flex items-center justify-between gap-2 text-[11px] text-charcoal-500">
        <span className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rice-200 text-[10px] font-bold text-charcoal-700">
            {item.assignee.slice(0, 1)}
          </span>
          <span className="truncate">{item.assignee}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1"><FileText size={12} />{item.evidence.length} 项证据</span>
      </span>
    </button>
  )
}

export function BoardColumns({ items, stats, onOpen }: BoardColumnsProps) {
  return (
    <div className="overflow-x-auto pb-3" data-testid="board-columns-scroll">
      <div className="grid min-w-[1180px] grid-cols-5 gap-3 lg:min-w-0">
        {STATUS_META.map((status, index) => {
          const columnItems = items.filter((item) => item.status === status.value)
          return (
            <section
              key={status.value}
              role="listitem"
              aria-labelledby={`column-title-${index}`}
              data-testid={`column-${status.value}`}
              className="flex min-h-[420px] flex-col rounded-2xl border border-charcoal-900/5 bg-rice-50/80 p-2.5"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-sm font-bold text-charcoal-900">
                  <i aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${columnAccent[status.value]}`} />
                  <strong id={`column-title-${index}`}>{status.label}</strong>
                </span>
                <span
                  data-testid={`column-count-${status.key}`}
                  aria-label={`${status.label}共 ${stats.counts[status.value]} 条`}
                  className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-charcoal-700 shadow-sm"
                >
                  {stats.counts[status.value]}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {columnItems.length > 0
                  ? columnItems.map((item) => <Card key={item.id} item={item} onOpen={onOpen} />)
                  : <p className="rounded-xl border border-dashed border-charcoal-900/10 px-3 py-4 text-center text-xs leading-5 text-charcoal-500">当前筛选下暂无工作项</p>}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
