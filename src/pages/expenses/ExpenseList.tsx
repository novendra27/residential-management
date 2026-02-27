import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/shared/Pagination'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { expenseService } from '@/services/expense.service'
import { formatCurrency, formatDate, MONTH_NAMES } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import type { Expense } from '@/types'

type ExpenseSortKey = keyof Pick<Expense, 'expense_name' | 'expense_date' | 'amount' | 'is_monthly' | 'created_at'>

function SortIcon({ col, sortKey, sortDir }: { col: ExpenseSortKey; sortKey: ExpenseSortKey | null; sortDir: 'asc' | 'desc' }) {
  if (sortKey !== col) return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />
  return sortDir === 'asc'
    ? <ArrowUp className="ml-1 h-3 w-3 inline text-primary" />
    : <ArrowDown className="ml-1 h-3 w-3 inline text-primary" />
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

export default function ExpenseList() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<ExpenseSortKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['expenses', page, filterMonth, filterYear, filterType],
    queryFn: async () => {
      const result = await expenseService.getAll({
        page,
        month: filterMonth === 'all' ? undefined : Number(filterMonth),
        year: filterYear === 'all' ? undefined : Number(filterYear),
        is_monthly: filterType === 'all' ? undefined : filterType === 'rutin',
      })
      if (!result.ok) throw new Error(result.message)
      return result
    },
  })

  const expenses = useMemo(() => data?.data ?? [], [data?.data])
  const meta = data?.meta

  const handleSort = (key: ExpenseSortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const processed = useMemo(() => {
    const q = search.toLowerCase()
    let list = [...expenses]

    if (q) {
      list = list.filter(e =>
        e.expense_name.toLowerCase().includes(q) ||
        (e.description ?? '').toLowerCase().includes(q)
      )
    }
    if (filterYear !== 'all') {
      const y = Number(filterYear)
      list = list.filter(e => new Date(e.expense_date).getFullYear() === y)
    }
    if (filterMonth !== 'all') {
      const m = Number(filterMonth)
      list = list.filter(e => new Date(e.expense_date).getMonth() + 1 === m)
    }
    if (filterType !== 'all') {
      const isMonthly = filterType === 'rutin'
      list = list.filter(e => e.is_monthly === isMonthly)
    }

    if (sortKey) {
      list.sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey]
        let cmp: number
        if (typeof av === 'boolean') cmp = av === bv ? 0 : av ? -1 : 1
        else if (typeof av === 'number') cmp = (av as number) - (bv as number)
        else cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'id')
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return list
  }, [expenses, search, sortKey, sortDir, filterYear, filterMonth, filterType])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    const result = await expenseService.delete(deleteTarget.id)
    setIsDeleting(false)
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success('Pengeluaran berhasil dihapus.')
    queryClient.invalidateQueries({ queryKey: ['expenses'] })
    setDeleteTarget(null)
  }

  const SORT_COLS: { key: ExpenseSortKey; label: string }[] = [
    { key: 'expense_name', label: 'Nama Pengeluaran' },
    { key: 'expense_date', label: 'Tanggal' },
    { key: 'amount', label: 'Jumlah' },
    { key: 'is_monthly', label: 'Tipe' },
    { key: 'created_at', label: 'Dicatat' },
  ]

  const handleMonthChange = (v: string) => {
    setFilterMonth(v)
    if (v !== 'all' && filterYear === 'all') setFilterYear(String(CURRENT_YEAR))
    setPage(1)
  }

  const handleYearChange = (v: string) => {
    setFilterYear(v)
    if (v === 'all') setFilterMonth('all')
    setPage(1)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengeluaran</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta ? `${meta.total} catatan pengeluaran` : 'Kelola data pengeluaran perumahan'}
          </p>
        </div>
        <Button onClick={() => navigate('/expenses/new')} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Tambah Pengeluaran
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm px-5 py-4 flex flex-wrap gap-3">
        <Select value={filterType} onValueChange={v => { setFilterType(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="rutin">Rutin</SelectItem>
            <SelectItem value="insidental">Insidental</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterMonth} onValueChange={handleMonthChange}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Bulan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Bulan</SelectItem>
            {MONTH_NAMES.slice(1).map((name, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterYear} onValueChange={handleYearChange}>
          <SelectTrigger className="h-9 w-32 text-sm">
            <SelectValue placeholder="Tahun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun</SelectItem>
            {YEARS.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama pengeluaran atau keterangan..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="pl-9 h-9 bg-white"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <ErrorMessage message={error?.message ?? 'Gagal memuat data pengeluaran.'} />
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Receipt className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">Belum ada data pengeluaran</p>
            <p className="text-sm text-muted-foreground mt-1">Mulai dengan mencatat pengeluaran pertama</p>
          </div>
          <Button onClick={() => navigate('/expenses/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Pengeluaran
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                  {SORT_COLS.map((col, i) => (
                    <TableHead
                      key={col.key}
                      className={`text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors${i === 0 ? ' pl-5' : ''}`}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}<SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                    </TableHead>
                  ))}
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {processed.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                      Tidak ada data yang cocok dengan pencarian.
                    </TableCell>
                  </TableRow>
                ) : processed.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0">
                    <TableCell className="py-3.5 pl-5">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{expense.expense_name}</p>
                        {expense.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{expense.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(expense.expense_date)}</TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{formatCurrency(expense.amount)}</TableCell>
                    <TableCell>
                      {expense.is_monthly ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          Rutin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 ring-1 ring-orange-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                          Insidental
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(expense.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-blue-50"
                          onClick={() => navigate(`/expenses/${expense.id}/edit`)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-red-50"
                          onClick={() => setDeleteTarget(expense)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {meta && (
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Pengeluaran"
        description={`Apakah Anda yakin ingin menghapus "${deleteTarget?.expense_name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  )
}
