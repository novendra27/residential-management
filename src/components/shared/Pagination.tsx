import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  lastPage: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, lastPage, onPageChange }: PaginationProps) {
  if (lastPage <= 1) return null

  const pages = Array.from({ length: lastPage }, (_, i) => i + 1)

  // Show max 5 pages around current
  const visiblePages = pages.filter((p) => {
    return p === 1 || p === lastPage || Math.abs(p - currentPage) <= 2
  })

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {visiblePages.map((page, i) => {
        const prev = visiblePages[i - 1]
        const showEllipsis = prev && page - prev > 1

        return (
          <span key={page} className="flex items-center gap-1">
            {showEllipsis && (
              <span className="px-1 text-muted-foreground text-sm">…</span>
            )}
            <Button
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              className="h-8 w-8 p-0 text-sm"
            >
              {page}
            </Button>
          </span>
        )
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
