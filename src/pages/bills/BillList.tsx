import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ArrowUpDown, FileText, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Pagination } from '@/components/shared/Pagination'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { billService } from '@/services/bill.service'
import { formatCurrency, formatPeriod, MONTH_NAMES } from '@/lib/utils'
import type { Bill } from '@/types'

type BillSortKey = 'house' | 'resident' | 'fee_type' | 'period_start' | 'total_amount' | 'is_paid'

function SortIcon({ col, sortKey, sortDir }: { col: BillSortKey; sortKey: BillSortKey | null; sortDir: 'asc' | 'desc' }) {
  if (sortKey !== col) return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />
  return sortDir === 'asc'
    ? <ArrowUp className="ml-1 h-3 w-3 inline text-primary" />
    : <ArrowDown className="ml-1 h-3 w-3 inline text-primary" />
}

function getBillSortValue(bill: Bill, key: BillSortKey): string | number | boolean {
  switch (key) {
    case 'house': return bill.house.house_number
    case 'resident': return bill.resident?.full_name ?? ''
    case 'fee_type': return bill.fee_type.fee_name
    case 'period_start': return bill.period_start
    case 'total_amount': return bill.total_amount
    case 'is_paid': return bill.is_paid
  }
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

export default function BillList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<BillSortKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterPaid, setFilterPaid] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['bills', page, filterPaid, filterMonth, filterYear],
    queryFn: async () => {
      const result = await billService.getAll({
        page,
        is_paid: filterPaid === 'all' ? undefined : filterPaid === '1',
        month: filterMonth === 'all' ? undefined : Number(filterMonth),
        year: filterYear === 'all' ? undefined : Number(filterYear),
      })
      if (!result.ok) throw new Error(result.message)
      return result
    },
  })

  const bills = useMemo(() => data?.data ?? [], [data?.data])
  const meta = data?.meta

  const handleFilterChange = () => setPage(1)

  const handleSort = (key: BillSortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const processed = useMemo(() => {
    const q = search.toLowerCase()
    const list = q
      ? bills.filter(b =>
          b.house.house_number.toLowerCase().includes(q) ||
          (b.resident?.full_name ?? '').toLowerCase().includes(q) ||
          b.fee_type.fee_name.toLowerCase().includes(q)
        )
      : [...bills]
    if (sortKey) {
      list.sort((a, b) => {
        const av = getBillSortValue(a, sortKey)
        const bv = getBillSortValue(b, sortKey)
        const cmp = typeof av === 'number'
          ? (av as number) - (bv as number)
          : typeof av === 'boolean'
          ? (av === bv ? 0 : av ? -1 : 1)
          : String(av).localeCompare(String(bv), 'id')
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return list
  }, [bills, search, sortKey, sortDir])

  const handleMonthChange = (v: string) => {
    setFilterMonth(v)
    // Jika bulan dipilih tapi tahun belum diisi, default ke tahun sekarang
    if (v !== 'all' && filterYear === 'all') {
      setFilterYear(String(CURRENT_YEAR))
    }
    handleFilterChange()
  }

  const handleYearChange = (v: string) => {
    setFilterYear(v)
    // Jika tahun di-reset, bulan ikut di-reset agar tidak ada filter bulan tanpa tahun
    if (v === 'all') setFilterMonth('all')
    handleFilterChange()
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tagihan Iuran</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta ? `${meta.total} tagihan ditemukan` : 'Kelola tagihan iuran warga'}
          </p>
        </div>
        <Button onClick={() => navigate('/bills/new')} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Buat Tagihan
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm px-5 py-4 flex flex-wrap gap-3">
        <Select
          value={filterPaid}
          onValueChange={(v) => { setFilterPaid(v); handleFilterChange() }}
        >
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="0">Belum Lunas</SelectItem>
            <SelectItem value="1">Lunas</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterMonth}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Bulan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Bulan</SelectItem>
            {MONTH_NAMES.slice(1).map((m, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterYear}
          onValueChange={handleYearChange}
        >
          <SelectTrigger className="h-9 w-32 text-sm">
            <SelectValue placeholder="Tahun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari rumah, penghuni, atau jenis iuran..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9 bg-white"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <ErrorMessage message={error?.message ?? 'Gagal memuat data tagihan.'} />
      ) : bills.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">Tidak ada tagihan ditemukan</p>
            <p className="text-sm text-muted-foreground mt-1">Coba ubah filter atau buat tagihan baru</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                  {(['house', 'resident', 'fee_type', 'period_start', 'total_amount', 'is_paid'] as BillSortKey[]).map((key, i) => {
                    const labels: Record<BillSortKey, string> = {
                      house: 'Rumah', resident: 'Penghuni', fee_type: 'Jenis Iuran',
                      period_start: 'Periode', total_amount: 'Jumlah', is_paid: 'Status',
                    }
                    return (
                      <TableHead
                        key={key}
                        className={`text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors${i === 0 ? ' pl-5' : ''}`}
                        onClick={() => handleSort(key)}
                      >
                        {labels[key]}<SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                      </TableHead>
                    )
                  })}
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {processed.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">Tidak ada tagihan yang cocok dengan pencarian.</TableCell></TableRow>
                ) : processed.map((bill) => (
                  <TableRow
                    key={bill.id}
                    className="cursor-pointer hover:bg-blue-50/50 transition-colors border-b border-border/40 last:border-0"
                    onClick={() => navigate(`/bills/${bill.id}`)}
                  >
                    <TableCell className="py-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-sm">{bill.house.house_number}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {bill.resident?.full_name ?? <span className="italic text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{bill.fee_type.fee_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatPeriod(bill.period_start, bill.period_end)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(bill.total_amount)}</TableCell>
                    <TableCell>
                      {bill.is_paid ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Lunas
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-red-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          Belum Lunas
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-primary hover:underline">Lihat →</span>
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
    </div>
  )
}
