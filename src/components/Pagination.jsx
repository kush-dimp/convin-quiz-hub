import { ChevronLeft, ChevronRight } from 'lucide-react'

const PER_PAGE_OPTIONS = [12, 24, 48, 96]

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = [1]
  if (current > 3) pages.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('…')
  if (total > 1) pages.push(total)
  return pages
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) {
  if (totalItems === 0) return null

  const from = (currentPage - 1) * itemsPerPage + 1
  const to   = Math.min(currentPage * itemsPerPage, totalItems)
  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-gray-200">
      {/* Info */}
      <p className="text-sm text-gray-500 order-2 sm:order-1">
        Showing{' '}
        <span className="font-semibold text-gray-700">{from}–{to}</span>
        {' '}of{' '}
        <span className="font-semibold text-gray-700">{totalItems}</span>
        {' '}quizzes
      </p>

      <div className="flex items-center gap-4 order-1 sm:order-2 flex-wrap justify-center">
        {/* Page controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-[#FF6B9D] hover:text-[#E63E6D] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {pages.map((page, i) =>
              page === '…' ? (
                <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm select-none">
                  …
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-[#E63E6D] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-[#FF6B9D] hover:text-[#E63E6D] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Items per page */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 whitespace-nowrap">Per page:</span>
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {PER_PAGE_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => { onItemsPerPageChange(n); onPageChange(1) }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  n === itemsPerPage
                    ? 'bg-white text-[#E63E6D] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
