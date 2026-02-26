import { useState, useRef, useEffect } from 'react'
import {
  Search, X, ChevronDown, Calendar, Tag,
  LayoutGrid, List, AlignJustify, ArrowUp, ArrowDown,
} from 'lucide-react'

/* ── Dropdown base ─────────────────────────────────────────── */
function DropdownBase({ trigger, panel, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((p) => !p) })}
      {open && (
        <div
          className={`absolute top-11 z-30 bg-white border border-gray-200 rounded-xl shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {panel({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  )
}

/* ── Single-select dropdown ────────────────────────────────── */
function SelectDropdown({ options, value, onChange, align = 'left' }) {
  const current = options.find((o) => o.value === value)
  const isActive = value !== options[0].value

  return (
    <DropdownBase
      align={align}
      trigger={({ open, toggle }) => (
        <button
          onClick={toggle}
          className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-sm font-medium transition-colors whitespace-nowrap shadow-sm ${
            isActive
              ? 'bg-[#FFF5F7] border-[#FFB3C6] text-[#C41E5C]'
              : 'bg-white border-gray-200 text-gray-700 hover:border-[#FF6B9D] hover:text-[#E63E6D]'
          }`}
        >
          {current?.label}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      )}
      panel={({ close }) => (
        <div className="py-1 min-w-[170px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); close() }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                opt.value === value
                  ? 'bg-[#FFF5F7] text-[#E63E6D] font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
              {opt.value === value && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B9D] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    />
  )
}

/* ── Multi-select dropdown ─────────────────────────────────── */
function MultiSelectDropdown({ label, options, value, onChange }) {
  const isActive = value.length > 0
  const display  = isActive ? `${value.length} selected` : label

  return (
    <DropdownBase
      trigger={({ open, toggle }) => (
        <button
          onClick={toggle}
          className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-sm font-medium transition-colors whitespace-nowrap shadow-sm ${
            isActive
              ? 'bg-[#FFF5F7] border-[#FFB3C6] text-[#C41E5C]'
              : 'bg-white border-gray-200 text-gray-700 hover:border-[#FF6B9D] hover:text-[#E63E6D]'
          }`}
        >
          {display}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      )}
      panel={() => (
        <div className="py-1 min-w-[210px] max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const checked = value.includes(opt)
            return (
              <label
                key={opt}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(checked ? value.filter((v) => v !== opt) : [...value, opt])
                  }
                  className="rounded accent-[#E63E6D]"
                />
                {opt}
              </label>
            )
          })}
          {isActive && (
            <div className="border-t border-gray-100 mt-1 pt-1 px-4 pb-1">
              <button
                onClick={() => onChange([])}
                className="text-xs text-[#E63E6D] hover:text-[#C41E5C] font-medium"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    />
  )
}

/* ── Date range dropdown ───────────────────────────────────── */
function DateRangeDropdown({ dateFrom, dateTo, onFromChange, onToChange }) {
  const isActive = dateFrom || dateTo

  const PRESETS = [
    { label: 'Last 7 days',  days: 7   },
    { label: 'Last 15 days', days: 15  },
    { label: 'Last 21 days', days: 21  },
    { label: 'Last 30 days', days: 30  },
    { label: 'Last month',   days: null },
  ]

  function applyPreset(preset, close) {
    const today = new Date()
    const iso   = (d) => d.toISOString().split('T')[0]
    if (preset.days === null) {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const to   = new Date(today.getFullYear(), today.getMonth(), 0)
      onFromChange(iso(from)); onToChange(iso(to))
    } else {
      const from = new Date(today)
      from.setDate(today.getDate() - preset.days)
      onFromChange(iso(from)); onToChange(iso(today))
    }
    close()
  }

  return (
    <DropdownBase
      trigger={({ open, toggle }) => (
        <button
          onClick={toggle}
          className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-sm font-medium transition-colors whitespace-nowrap shadow-sm ${
            isActive
              ? 'bg-[#FFF5F7] border-[#FFB3C6] text-[#C41E5C]'
              : 'bg-white border-gray-200 text-gray-700 hover:border-[#FF6B9D] hover:text-[#E63E6D]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          {isActive ? 'Date set' : 'Date Range'}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      )}
      panel={({ close }) => (
        <div className="w-64">
          {/* Quick presets */}
          <div className="p-2 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1.5">Quick select</p>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset, close)}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-[#FFF5F7] hover:text-[#E63E6D] rounded-lg transition-colors font-medium"
              >
                {preset.label}
              </button>
            ))}
          </div>
          {/* Custom range */}
          <div className="p-4 space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custom range</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => onFromChange(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40 focus:border-[#FF6B9D]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => onToChange(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40 focus:border-[#FF6B9D]"
              />
            </div>
            {isActive && (
              <button
                onClick={() => { onFromChange(''); onToChange(''); close() }}
                className="w-full text-xs text-[#E63E6D] hover:text-[#C41E5C] font-medium text-center pt-1"
              >
                Clear dates
              </button>
            )}
          </div>
        </div>
      )}
    />
  )
}

/* ── Active filter chip ────────────────────────────────────── */
function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#FFE5EC] text-[#C41E5C] text-xs font-medium px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:text-[#2D0A1A] transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

/* ── View toggle ───────────────────────────────────────────── */
const VIEW_OPTIONS = [
  { value: 'grid',    Icon: LayoutGrid,   title: 'Grid view (G)'    },
  { value: 'list',    Icon: List,         title: 'List view (L)'    },
  { value: 'compact', Icon: AlignJustify, title: 'Compact view (C)' },
]

/* ── Sort options ──────────────────────────────────────────── */
const SORT_OPTIONS = [
  { value: 'date',   label: 'Date Modified'  },
  { value: 'title',  label: 'Title'           },
  { value: 'views',  label: 'Most Popular'   },
  { value: 'taken',  label: 'Most Taken'     },
  { value: 'rating', label: 'Highest Rated'  },
]

/* ── Main FilterBar ────────────────────────────────────────── */
export default function FilterBar({
  searchInput,
  onSearchChange,
  filters,
  onFilterChange,
  onClearAll,
  sort,
  onSortChange,
  sortDir,
  onSortDirChange,
  view,
  onViewChange,
  categories,
  instructors,
  tags,
  resultCount,
  isLoading,
}) {
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.category !== 'all' ||
    filters.instructors.length > 0 ||
    filters.tags.length > 0 ||
    filters.dateFrom ||
    filters.dateTo ||
    searchInput.trim()

  const activeChips = [
    filters.status !== 'all' && {
      label: `Status: ${capitalize(filters.status)}`,
      onRemove: () => onFilterChange('status', 'all'),
    },
    filters.category !== 'all' && {
      label: `Category: ${filters.category}`,
      onRemove: () => onFilterChange('category', 'all'),
    },
    ...filters.instructors.map((name) => ({
      label: `Instructor: ${name.split(' ')[0]}`,
      onRemove: () => onFilterChange('instructors', filters.instructors.filter((x) => x !== name)),
    })),
    ...filters.tags.map((tag) => ({
      label: `#${tag}`,
      onRemove: () => onFilterChange('tags', filters.tags.filter((x) => x !== tag)),
    })),
    filters.dateFrom && {
      label: `From: ${filters.dateFrom}`,
      onRemove: () => onFilterChange('dateFrom', ''),
    },
    filters.dateTo && {
      label: `To: ${filters.dateTo}`,
      onRemove: () => onFilterChange('dateTo', ''),
    },
  ].filter(Boolean)

  const statusOptions = [
    { value: 'all',       label: 'All Status'  },
    { value: 'published', label: 'Published'   },
    { value: 'draft',     label: 'Draft'       },
    { value: 'archived',  label: 'Archived'    },
  ]

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map((c) => ({ value: c, label: c })),
  ]

  return (
    <div className="relative z-40 glass-panel rounded-2xl px-5 py-4 space-y-2.5 mb-6">
      {/* ── Row 1: filter + view controls ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, description, instructor…"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm glass-input rounded-lg placeholder-gray-400"
          />
          {searchInput && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <SelectDropdown
          options={statusOptions}
          value={filters.status}
          onChange={(v) => onFilterChange('status', v)}
        />

        <SelectDropdown
          options={categoryOptions}
          value={filters.category}
          onChange={(v) => onFilterChange('category', v)}
        />

        <MultiSelectDropdown
          label="All Instructors"
          options={instructors}
          value={filters.instructors}
          onChange={(v) => onFilterChange('instructors', v)}
        />

        <DateRangeDropdown
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onFromChange={(v) => onFilterChange('dateFrom', v)}
          onToChange={(v) => onFilterChange('dateTo', v)}
        />

        <div className="flex-1" />

        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}

        {/* Sort direction toggle */}
        <button
          onClick={() => onSortDirChange(sortDir === 'desc' ? 'asc' : 'desc')}
          title={sortDir === 'desc' ? 'Descending — click to sort ascending' : 'Ascending — click to sort descending'}
          className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:border-[#FF6B9D] hover:text-[#E63E6D] transition-colors shadow-sm"
        >
          {sortDir === 'desc'
            ? <ArrowDown className="w-4 h-4" />
            : <ArrowUp   className="w-4 h-4" />}
        </button>

        {/* Sort dropdown */}
        <SelectDropdown
          options={SORT_OPTIONS}
          value={sort}
          onChange={onSortChange}
          align="right"
        />

        {/* Separator */}
        <div className="w-px h-7 bg-gray-200 mx-0.5" />

        {/* View toggle */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {VIEW_OPTIONS.map(({ value, Icon, title }) => (
            <button
              key={value}
              onClick={() => onViewChange(value)}
              title={title}
              className={`p-1.5 rounded-md transition-all ${
                view === value
                  ? 'bg-white shadow-sm text-[#E63E6D]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Row 2: tag chips ── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-xs text-gray-400 font-medium mr-0.5 flex-shrink-0">
            <Tag className="w-3 h-3" />
            Tags:
          </span>
          {tags.map((tag) => {
            const active = filters.tags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() =>
                  onFilterChange(
                    'tags',
                    active ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag]
                  )
                }
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-150 ${
                  active
                    ? 'bg-[#E63E6D] text-white shadow-sm scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-[#FFF5F7] hover:text-[#E63E6D]'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Row 3: active chips + count ── */}
      {(activeChips.length > 0 || !isLoading) && (
        <div className="flex flex-wrap items-center gap-1.5 min-h-[24px]">
          {activeChips.map((chip, i) => (
            <FilterChip key={i} label={chip.label} onRemove={chip.onRemove} />
          ))}
          {!isLoading && (
            <span className="ml-auto text-[11px] font-semibold text-slate-500 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/60 shadow-sm">
              <span className="font-bold text-slate-700">{resultCount}</span>{' '}
              quiz{resultCount !== 1 ? 'zes' : ''} found
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
