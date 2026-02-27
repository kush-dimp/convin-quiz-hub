import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LayoutGrid } from 'lucide-react'
import VersionHistory from './VersionHistory'
import QuizCard, { SkeletonCard } from './QuizCard'
import { QuizListCard, QuizCompactView } from './QuizListViews'
import FilterBar from './FilterBar'
import BulkActionBar from './BulkActionBar'
import ConfirmModal from './ConfirmModal'
import Pagination from './Pagination'
import { ToastContainer } from './Toast'
import DuplicateModal from './DuplicateModal'
import { useQuizzes } from '../hooks/useQuizzes'
import { useDebounce } from '../hooks/useDebounce'

const DEFAULT_FILTERS = {
  status: 'all', category: 'all',
  instructors: [], tags: [],
  dateFrom: '', dateTo: '',
}

/* ── localStorage helpers ──────────────────────────────────── */
function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback }
  catch { return fallback }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

function readUrlParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    search: p.get('q') || '',
    sort:   p.get('sort') || 'date',
    filters: {
      status:      p.get('status')      || 'all',
      category:    p.get('category')    || 'all',
      instructors: p.get('instructors') ? p.get('instructors').split(',') : [],
      tags:        p.get('tags')        ? p.get('tags').split(',')        : [],
      dateFrom:    p.get('from')        || '',
      dateTo:      p.get('to')          || '',
    },
  }
}

function EmptyState({ hasFilters, onClearAll }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <LayoutGrid className="w-8 h-8 text-gray-300" />
      </div>
      <p className="text-base font-semibold text-gray-600">No quizzes found</p>
      {hasFilters ? (
        <>
          <p className="text-sm text-gray-400 mt-1.5 max-w-xs">
            No quizzes match your current filters. Try broadening your search or clearing some filters.
          </p>
          <button
            onClick={onClearAll}
            className="mt-4 px-4 py-2 text-sm font-semibold text-[#E63E6D] bg-[#FFF5F7] hover:bg-[#FFE5EC] rounded-lg transition-colors"
          >
            Clear all filters
          </button>
        </>
      ) : (
        <p className="text-sm text-gray-400 mt-1.5">Create your first quiz to get started.</p>
      )}
    </div>
  )
}

let toastCounter = 0

export default function QuizGrid() {
  const init = readUrlParams()
  const navigate = useNavigate()

  /* ── Real data from Supabase ── */
  const { quizzes: rawQuizzes, loading: dataLoading, createQuiz, deleteQuiz, publishQuiz } = useQuizzes()

  /* ── Local quizzes state (mirrors hook but allows optimistic UI) ── */
  const [localQuizzes, setLocalQuizzes] = useState([])

  /* Sync localQuizzes whenever rawQuizzes changes */
  useEffect(() => {
    setLocalQuizzes(rawQuizzes)
  }, [rawQuizzes])

  /* ── Derive stable option lists from loaded data ── */
  const ALL_CATEGORIES  = useMemo(() => [...new Set(localQuizzes.map((q) => q.category).filter(Boolean))].sort(), [localQuizzes])
  const ALL_INSTRUCTORS = useMemo(() => [...new Set(localQuizzes.map((q) => q.profiles?.name).filter(Boolean))].sort(), [localQuizzes])
  const ALL_TAGS        = useMemo(() => [...new Set(localQuizzes.flatMap((q) => q.tags ?? []))].sort(), [localQuizzes])

  /* ── Filters ── */
  const [searchInput, setSearchInput] = useState(init.search)
  const [sort,        setSort]        = useState(() => lsGet('qp_sort', init.sort))
  const [sortDir,     setSortDir]     = useState(() => lsGet('qp_sort_dir', 'desc'))
  const [filters,     setFilters]     = useState(init.filters)

  /* ── View & pagination ── */
  const [view,         setView]         = useState(() => lsGet('qp_view', 'grid'))
  const [itemsPerPage, setItemsPerPage] = useState(() => lsGet('qp_ipp', 12))
  const [currentPage,  setCurrentPage]  = useState(1)
  const [viewAnimKey,  setViewAnimKey]  = useState(0)

  /* ── UI states ── */
  const [selectedIds,     setSelectedIds]     = useState(new Set())
  const [bulkOp,          setBulkOp]          = useState(null)
  const [modal,           setModal]           = useState(null)
  const [toasts,          setToasts]          = useState([])
  const [duplicateTarget, setDuplicateTarget] = useState(null)
  const [highlightedId,   setHighlightedId]   = useState(null)
  const [historyQuiz,     setHistoryQuiz]     = useState(null)
  const [isCreating,      setIsCreating]      = useState(false)

  const debouncedSearch = useDebounce(searchInput, 300)

  /* ── Persist preferences ── */
  useEffect(() => { lsSet('qp_view',     view)        }, [view])
  useEffect(() => { lsSet('qp_ipp',      itemsPerPage) }, [itemsPerPage])
  useEffect(() => { lsSet('qp_sort',     sort)         }, [sort])
  useEffect(() => { lsSet('qp_sort_dir', sortDir)      }, [sortDir])

  /* ── Reset page on filter/sort change ── */
  useEffect(() => { setCurrentPage(1) }, [debouncedSearch, filters, sort, sortDir])

  /* ── Sync to URL ── */
  useEffect(() => {
    const p = new URLSearchParams()
    if (debouncedSearch)            p.set('q',           debouncedSearch)
    if (sort !== 'date')            p.set('sort',        sort)
    if (filters.status !== 'all')   p.set('status',      filters.status)
    if (filters.category !== 'all') p.set('category',    filters.category)
    if (filters.instructors.length) p.set('instructors', filters.instructors.join(','))
    if (filters.tags.length)        p.set('tags',        filters.tags.join(','))
    if (filters.dateFrom)           p.set('from',        filters.dateFrom)
    if (filters.dateTo)             p.set('to',          filters.dateTo)
    const qs = p.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [debouncedSearch, sort, filters])

  /* ── Keyboard shortcuts G / L / C ── */
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'g' || e.key === 'G') changeView('grid')
      if (e.key === 'l' || e.key === 'L') changeView('list')
      if (e.key === 'c' || e.key === 'C') changeView('compact')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function changeView(v) {
    setView(v)
    setViewAnimKey((k) => k + 1)
  }

  /* ── Filter + sort ── */
  const filteredQuizzes = useMemo(() => {
    let list = [...localQuizzes]
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter(
        (x) =>
          x.title?.toLowerCase().includes(q) ||
          x.description?.toLowerCase().includes(q) ||
          x.profiles?.name?.toLowerCase().includes(q)
      )
    }
    if (filters.status !== 'all')   list = list.filter((x) => x.status === filters.status)
    if (filters.category !== 'all') list = list.filter((x) => x.category === filters.category)
    if (filters.instructors.length) list = list.filter((x) => filters.instructors.includes(x.profiles?.name))
    if (filters.tags.length)        list = list.filter((x) => filters.tags.some((t) => (x.tags ?? []).includes(t)))
    if (filters.dateFrom)           list = list.filter((x) => x.created_at >= filters.dateFrom)
    if (filters.dateTo)             list = list.filter((x) => x.created_at <= filters.dateTo)

    const dir = sortDir === 'asc' ? 1 : -1
    switch (sort) {
      case 'date':   list.sort((a, b) => dir * (new Date(a.updated_at) - new Date(b.updated_at))); break
      case 'title':  list.sort((a, b) => dir * a.title.localeCompare(b.title)); break
      case 'views':  list.sort((a, b) => dir * ((a.quiz_stats?.views ?? 0) - (b.quiz_stats?.views ?? 0))); break
      case 'taken':  list.sort((a, b) => dir * ((a.quiz_stats?.previews ?? 0) - (b.quiz_stats?.previews ?? 0))); break
    }
    return list
  }, [localQuizzes, debouncedSearch, filters, sort, sortDir])

  /* ── Pagination slice ── */
  const totalPages       = Math.max(1, Math.ceil(filteredQuizzes.length / itemsPerPage))
  const safePage         = Math.min(currentPage, totalPages)
  const displayedQuizzes = filteredQuizzes.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  )

  /* ── Toast helpers ── */
  function addToast(type, message, undoData = null, duration) {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, type, message, undoData, duration }])
  }
  function removeToast(id) { setToasts((prev) => prev.filter((t) => t.id !== id)) }
  function handleUndo(undoData) {
    if (!undoData) return
    if (undoData.type === 'delete') {
      setLocalQuizzes((prev) => {
        const restored = undoData.items.filter((item) => !prev.find((q) => q.id === item.id))
        return [...prev, ...restored].sort((a, b) => a.id - b.id)
      })
      addToast('success', `${undoData.items.length} quiz${undoData.items.length !== 1 ? 'zes' : ''} restored`)
    } else if (undoData.type === 'archive') {
      setLocalQuizzes((prev) =>
        prev.map((q) => { const o = undoData.items.find((x) => x.id === q.id); return o ?? q })
      )
      addToast('success', `${undoData.items.length} quiz${undoData.items.length !== 1 ? 'zes' : ''} restored`)
    }
  }

  /* ── Highlight auto-clear ── */
  useEffect(() => {
    if (!highlightedId) return
    const t = setTimeout(() => setHighlightedId(null), 3000)
    return () => clearTimeout(t)
  }, [highlightedId])

  /* ── Create Quiz handler ── */
  async function handleCreateQuiz() {
    if (isCreating) return
    setIsCreating(true)
    try {
      const { data, error } = await createQuiz({ title: 'Untitled Quiz', description: '', category: 'General' })
      if (!error && data?.id) {
        navigate('/quizzes/' + data.id + '/editor')
      } else {
        addToast('error', 'Failed to create quiz. Please try again.')
      }
    } catch {
      addToast('error', 'Failed to create quiz. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  /* ── Duplicate handlers ── */
  function handleDuplicate(quiz) { setDuplicateTarget(quiz) }
  function handleDuplicateSuccess(newQuiz) {
    setLocalQuizzes((prev) => [newQuiz, ...prev])
    setHighlightedId(newQuiz.id)
    addToast('success', `"${newQuiz.title}" duplicated successfully`)
  }

  /* ── Bulk operation executor ── */
  async function executeBulkOp(type, ids, extraData = {}) {
    const affected = localQuizzes.filter((q) => ids.has(q.id))
    setBulkOp({ progress: 0, total: ids.size })
    for (let i = 0; i < ids.size; i++) { await sleep(220); setBulkOp({ progress: i + 1, total: ids.size }) }
    const n = ids.size; const label = `${n} quiz${n !== 1 ? 'zes' : ''}`
    switch (type) {
      case 'delete':
        setLocalQuizzes((prev) => prev.filter((q) => !ids.has(q.id)))
        addToast('undo', `${label} deleted`, { type: 'delete', items: affected }, 5500); break
      case 'archive':
        setLocalQuizzes((prev) => prev.map((q) => ids.has(q.id) ? { ...q, status: 'archived' } : q))
        addToast('undo', `${label} archived`, { type: 'archive', items: affected }, 5500); break
      case 'move':
        setLocalQuizzes((prev) => prev.map((q) => ids.has(q.id) ? { ...q, folder: extraData.folder } : q))
        addToast('success', `${label} moved to "${extraData.folder}"`); break
      case 'changeStatus':
        setLocalQuizzes((prev) => prev.map((q) => ids.has(q.id) ? { ...q, status: extraData.newStatus } : q))
        addToast('success', `${label} set to "${extraData.newStatus}"`); break
      case 'export': {
        const blob = new Blob([JSON.stringify(affected, null, 2)], { type: 'application/json' })
        const url  = URL.createObjectURL(blob)
        const a    = Object.assign(document.createElement('a'), { href: url, download: `quizzes-${Date.now()}.json` })
        a.click(); URL.revokeObjectURL(url)
        addToast('success', `${label} exported`); break
      }
    }
    setBulkOp(null); setSelectedIds(new Set())
  }

  /* ── Bulk triggers ── */
  const triggerDelete       = () => setModal({ type: 'delete',       items: localQuizzes.filter((q) => selectedIds.has(q.id)) })
  const triggerArchive      = () => setModal({ type: 'archive',      items: localQuizzes.filter((q) => selectedIds.has(q.id)) })
  const triggerMove         = () => setModal({ type: 'move',         items: localQuizzes.filter((q) => selectedIds.has(q.id)) })
  const triggerChangeStatus = () => setModal({ type: 'changeStatus', items: localQuizzes.filter((q) => selectedIds.has(q.id)) })
  const triggerExport       = () => executeBulkOp('export', new Set(selectedIds))

  function handleModalConfirm(extra) {
    const ids = new Set(modal.items.map((x) => x.id)); const type = modal.type
    setModal(null); executeBulkOp(type, ids, extra)
  }

  /* ── Selection helpers ── */
  function toggleCard(id) {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const selectAll   = () => setSelectedIds(new Set(displayedQuizzes.map((q) => q.id)))
  const deselectAll = () => setSelectedIds(new Set())

  const hasActiveFilters = debouncedSearch.trim() || filters.status !== 'all' ||
    filters.category !== 'all' || filters.instructors.length ||
    filters.tags.length || filters.dateFrom || filters.dateTo

  const allSelected  = displayedQuizzes.length > 0 && displayedQuizzes.every((q) => selectedIds.has(q.id))
  const someSelected = displayedQuizzes.some((q) => selectedIds.has(q.id))
  const isSelectionMode = selectedIds.size > 0

  /* ── Shared card props ── */
  const cardProps = (quiz) => ({
    quiz,
    isSelected:     selectedIds.has(quiz.id),
    onToggleSelect: () => toggleCard(quiz.id),
    isDisabled:     !!bulkOp,
    isSelectionMode,
    onDuplicate:    handleDuplicate,
    isHighlighted:  quiz.id === highlightedId,
    onHistory:      () => setHistoryQuiz(quiz),
    onDelete:       () => setModal({ type: 'delete', items: [quiz] }),
  })

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-10 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold text-slate-900 leading-none">My Quizzes</h1>
            <p className="font-body text-[11px] text-slate-400 mt-0.5">{localQuizzes.length} quizzes total</p>
          </div>
          <button
            onClick={handleCreateQuiz}
            disabled={isCreating}
            className="btn-shine flex items-center gap-2 bg-gradient-to-r from-[#FF6B9D] to-[#E63E6D] hover:from-[#E63E6D] hover:to-[#C41E5C] text-white px-4 py-2 rounded-xl text-[13px] font-semibold transition-all shadow-sm shadow-[#FFB3C6] flex-shrink-0 disabled:opacity-60"
          >
            <Plus className="w-3.5 h-3.5" />
            {isCreating ? 'Creating…' : 'Create Quiz'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <FilterBar
          searchInput={searchInput}   onSearchChange={setSearchInput}
          filters={filters}           onFilterChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
          onClearAll={() => { setSearchInput(''); setFilters(DEFAULT_FILTERS); setSort('date') }}
          sort={sort}                 onSortChange={setSort}
          sortDir={sortDir}           onSortDirChange={setSortDir}
          view={view}                 onViewChange={changeView}
          categories={ALL_CATEGORIES} instructors={ALL_INSTRUCTORS} tags={ALL_TAGS}
          resultCount={filteredQuizzes.length}
          isLoading={dataLoading}
        />

        {/* ── Skeleton (data loading) ── */}
        {dataLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            onClearAll={() => { setSearchInput(''); setFilters(DEFAULT_FILTERS) }}
          />
        ) : (
          <>
            {/* ── Animated view container ── */}
            <div key={viewAnimKey} className="animate-fade-in-up">

              {/* Grid view */}
              {view === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayedQuizzes.map((quiz, i) => (
                    <div key={quiz.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                      <QuizCard {...cardProps(quiz)} />
                    </div>
                  ))}
                </div>
              )}

              {/* List view */}
              {view === 'list' && (
                <div className="flex flex-col gap-2.5">
                  {displayedQuizzes.map((quiz, i) => (
                    <div key={quiz.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                      <QuizListCard {...cardProps(quiz)} />
                    </div>
                  ))}
                </div>
              )}

              {/* Compact view */}
              {view === 'compact' && (
                <QuizCompactView
                  quizzes={displayedQuizzes}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleCard}
                  isDisabled={!!bulkOp}
                  isSelectionMode={isSelectionMode}
                  onDuplicate={handleDuplicate}
                  highlightedId={highlightedId}
                  onHistory={(quiz) => setHistoryQuiz(quiz)}
                  onDelete={(quiz) => setModal({ type: 'delete', items: [quiz] })}
                />
              )}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={filteredQuizzes.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}
      </main>

      {/* Floating bulk action bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalDisplayed={displayedQuizzes.length}
        allSelected={allSelected}
        someSelected={someSelected}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onDelete={triggerDelete}
        onArchive={triggerArchive}
        onMove={triggerMove}
        onExport={triggerExport}
        onChangeStatus={triggerChangeStatus}
        bulkOp={bulkOp}
      />

      <ConfirmModal modal={modal} onConfirm={handleModalConfirm} onCancel={() => setModal(null)} />
      <ToastContainer toasts={toasts} onRemove={removeToast} onUndo={handleUndo} />

      {duplicateTarget && (
        <DuplicateModal
          quiz={duplicateTarget}
          onClose={() => setDuplicateTarget(null)}
          onSuccess={handleDuplicateSuccess}
        />
      )}

      {historyQuiz && (
        <VersionHistory quiz={historyQuiz} onClose={() => setHistoryQuiz(null)} />
      )}
    </div>
  )
}
