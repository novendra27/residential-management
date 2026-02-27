import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { reportService } from '@/services/report.service'
import { formatCurrency, formatDate, formatPeriod, MONTH_NAMES } from '@/lib/utils'
import type { IncomeEntry, Expense } from '@/types'

type IncomeSortKey = 'house' | 'resident' | 'payment_date' | 'amount_paid'
type ExpenseSortKey = 'expense_name' | 'is_monthly' | 'expense_date' | 'amount'

function SortIcon<T extends string>({ col, sortKey, sortDir }: { col: T; sortKey: T | null; sortDir: 'asc' | 'desc' }) {
  if (sortKey !== col) return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />
  return sortDir === 'asc'
    ? <ArrowUp className="ml-1 h-3 w-3 inline text-primary" />
    : <ArrowDown className="ml-1 h-3 w-3 inline text-primary" />
}

function getSortableIncomeValue(row: IncomeEntry, key: IncomeSortKey): string | number {
  switch (key) {
    case 'house':        return row.house.house_number
    case 'resident':     return row.resident.full_name
    case 'payment_date': return row.payment_date
    case 'amount_paid':  return row.amount_paid
  }
}

function getSortableExpenseValue(row: Expense, key: ExpenseSortKey): string | number | boolean {
  switch (key) {
    case 'expense_name': return row.expense_name
    case 'is_monthly':   return row.is_monthly
    case 'expense_date': return row.expense_date
    case 'amount':       return row.amount
  }
}

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

// â”€â”€ Custom Tooltip for chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill?: string; stroke?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border/60 rounded-xl shadow-lg px-4 py-3 text-sm space-y-1.5 min-w-48">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-medium" style={{ color: p.fill ?? p.stroke }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// â”€â”€ Stat card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StatCard({ label, value, color }: { label: string; value: number; color: 'green' | 'red' | 'blue' }) {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red:   'bg-red-50   text-red-700   border-red-100',
    blue:  'bg-blue-50  text-blue-700  border-blue-100',
  }
  return (
    <div className={`rounded-2xl border px-6 py-5 space-y-1 ${styles[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold">{formatCurrency(value)}</p>
    </div>
  )
}

// â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ReportPage() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [month, setMonth] = useState(CURRENT_MONTH)

  // Income table state
  const [incomeSearch, setIncomeSearch] = useState('')
  const [incomeSortKey, setIncomeSortKey] = useState<IncomeSortKey | null>(null)
  const [incomeSortDir, setIncomeSortDir] = useState<'asc' | 'desc'>('asc')

  // Expense table state
  const [expenseSearch, setExpenseSearch] = useState('')
  const [expenseSortKey, setExpenseSortKey] = useState<ExpenseSortKey | null>(null)
  const [expenseSortDir, setExpenseSortDir] = useState<'asc' | 'desc'>('asc')

  // Annual summary (chart)
  const { data: summaryData, isLoading: summaryLoading, isError: summaryError } = useQuery({
    queryKey: ['report-summary', year],
    queryFn: async () => {
      const result = await reportService.getSummary(year)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })

  // Monthly detail (balance)
  const { data: balanceData, isLoading: balanceLoading, isError: balanceError } = useQuery({
    queryKey: ['report-balances', month, year],
    queryFn: async () => {
      const result = await reportService.getBalances(month, year)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })

  // Chart data
  const chartData = (summaryData ?? []).map((row) => ({
    name: MONTH_NAMES[row.month]?.slice(0, 3) ?? String(row.month),
    Pemasukan: row.total_income,
    Pengeluaran: row.total_expense,
    Saldo: row.ending_balance,
  }))

  const handleIncomeSort = (key: IncomeSortKey) => {
    if (incomeSortKey === key) setIncomeSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setIncomeSortKey(key); setIncomeSortDir('asc') }
  }

  const handleExpenseSort = (key: ExpenseSortKey) => {
    if (expenseSortKey === key) setExpenseSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setExpenseSortKey(key); setExpenseSortDir('asc') }
  }

  const processedIncomes = useMemo(() => {
    const q = incomeSearch.toLowerCase()
    let list = [...(balanceData?.incomes ?? [])]
    if (q) {
      list = list.filter(r =>
        r.house.house_number.toLowerCase().includes(q) ||
        r.resident.full_name.toLowerCase().includes(q)
      )
    }
    if (incomeSortKey) {
      list.sort((a, b) => {
        const av = getSortableIncomeValue(a, incomeSortKey)
        const bv = getSortableIncomeValue(b, incomeSortKey)
        const cmp = typeof av === 'number'
          ? (av as number) - (bv as number)
          : String(av).localeCompare(String(bv), 'id')
        return incomeSortDir === 'asc' ? cmp : -cmp
      })
    }
    return list
  }, [balanceData?.incomes, incomeSearch, incomeSortKey, incomeSortDir])

  const processedExpenses = useMemo(() => {
    const q = expenseSearch.toLowerCase()
    let list = [...(balanceData?.expenses ?? [])]
    if (q) {
      list = list.filter(e =>
        e.expense_name.toLowerCase().includes(q) ||
        (e.description ?? '').toLowerCase().includes(q)
      )
    }
    if (expenseSortKey) {
      list.sort((a, b) => {
        const av = getSortableExpenseValue(a, expenseSortKey)
        const bv = getSortableExpenseValue(b, expenseSortKey)
        let cmp: number
        if (typeof av === 'boolean') cmp = av === bv ? 0 : av ? -1 : 1
        else if (typeof av === 'number') cmp = (av as number) - (bv as number)
        else cmp = String(av).localeCompare(String(bv), 'id')
        return expenseSortDir === 'asc' ? cmp : -cmp
      })
    }
    return list
  }, [balanceData?.expenses, expenseSearch, expenseSortKey, expenseSortDir])

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laporan Keuangan</h1>
          <p className="text-sm text-muted-foreground mt-1">Rekap pemasukan dan pengeluaran perumahan</p>
        </div>
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="h-9 w-32 bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="grafik">
        <TabsList className="mb-2">
          <TabsTrigger value="grafik">Grafik</TabsTrigger>
          <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
        </TabsList>

        {/* ── Tab: Grafik ── */}
        <TabsContent value="grafik" className="space-y-0">
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60 bg-muted/20">
              <h2 className="text-base font-semibold text-foreground">Grafik Keuangan Tahunan {year}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Perbandingan pemasukan, pengeluaran, dan saldo per bulan</p>
            </div>
            <div className="px-6 py-5">
              {summaryLoading ? (
                <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div>
              ) : summaryError ? (
                <ErrorMessage message="Gagal memuat data grafik." />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}rb` : String(v)}
                      tick={{ fontSize: 11 }}
                      width={56}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Pemasukan" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="Pengeluaran" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Line dataKey="Saldo" type="monotone" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Ringkasan ── */}
        <TabsContent value="ringkasan" className="space-y-6">
          {/* Monthly Summary Card */}
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Ringkasan {MONTH_NAMES[month]} {year}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Pilih bulan untuk melihat detail keuangan</p>
              </div>
              <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                <SelectTrigger className="h-9 w-44 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.slice(1).map((name, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {balanceLoading ? (
              <div className="px-6 py-10"><LoadingSpinner /></div>
            ) : balanceError || !balanceData ? (
              <div className="px-6 py-6"><ErrorMessage message="Gagal memuat data bulanan." /></div>
            ) : (
              <div className="px-6 py-5 grid grid-cols-3 gap-4">
                <StatCard label="Total Pemasukan" value={balanceData.total_income} color="green" />
                <StatCard label="Total Pengeluaran" value={balanceData.total_expense} color="red" />
                <StatCard
                  label="Saldo Akhir"
                  value={balanceData.ending_balance}
                  color={balanceData.ending_balance >= 0 ? 'blue' : 'red'}
                />
              </div>
            )}
          </div>

      {/* ── Income Table Card ── */}
      {balanceData && (
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 bg-muted/20">
            <h3 className="font-semibold text-sm text-foreground">Pemasukan</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {balanceData.incomes.length} transaksi · total {formatCurrency(balanceData.total_income)}
            </p>
          </div>
          <div className="px-5 py-3 border-b border-border/40 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari rumah atau penghuni..."
                value={incomeSearch}
                onChange={e => setIncomeSearch(e.target.value)}
                className="pl-9 h-9 bg-muted/30"
              />
            </div>
          </div>
          {balanceData.incomes.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">Tidak ada pemasukan pada bulan ini.</p>
          ) : (
            <div className="px-5 pb-5">
            <div className="rounded-xl border border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/60">
                  {([
                    { key: 'house'        as IncomeSortKey, label: 'Rumah',       cls: 'pl-5' },
                    { key: 'resident'     as IncomeSortKey, label: 'Penghuni',    cls: '' },
                    { key: null,                            label: 'Periode',     cls: '' },
                    { key: 'payment_date' as IncomeSortKey, label: 'Tgl Bayar',  cls: '' },
                    { key: 'amount_paid'  as IncomeSortKey, label: 'Jumlah',     cls: 'text-right pr-5' },
                  ] as { key: IncomeSortKey | null; label: string; cls: string }[]).map(({ key, label, cls }) => (
                    <TableHead
                      key={label}
                      className={`text-xs font-semibold uppercase tracking-wide text-muted-foreground ${key ? 'cursor-pointer select-none hover:text-foreground transition-colors' : ''} ${cls}`}
                      onClick={() => key && handleIncomeSort(key)}
                    >
                      {label}
                      {key && <SortIcon col={key} sortKey={incomeSortKey} sortDir={incomeSortDir} />}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedIncomes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                      Tidak ada data yang cocok dengan pencarian.
                    </TableCell>
                  </TableRow>
                ) : processedIncomes.map((income) => (
                  <TableRow key={income.payment_id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                    <TableCell className="pl-5 font-medium text-sm">{income.house.house_number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{income.resident.full_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatPeriod(income.bill.period_start, income.bill.period_end)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(income.payment_date)}</TableCell>
                    <TableCell className="text-sm font-semibold text-emerald-700 text-right pr-5">
                      {formatCurrency(income.amount_paid)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>            </div>
            </div>          )}
        </div>
      )}

      {/* ── Expense Table Card ── */}
      {balanceData && (
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm">
          <div className="px-5 py-4 border-b border-border/60 bg-muted/20">
            <h3 className="font-semibold text-sm text-foreground">Pengeluaran</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {balanceData.expenses.length} transaksi · total {formatCurrency(balanceData.total_expense)}
            </p>
          </div>
          <div className="px-5 py-3 border-b border-border/40 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama pengeluaran atau keterangan..."
                value={expenseSearch}
                onChange={e => setExpenseSearch(e.target.value)}
                className="pl-9 h-9 bg-muted/30"
              />
            </div>
          </div>
          {balanceData.expenses.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">Tidak ada pengeluaran pada bulan ini.</p>
          ) : (
            <div className="px-5 pb-5">
            <div className="rounded-xl border border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/60">
                  {([
                    { key: 'expense_name' as ExpenseSortKey, label: 'Nama Pengeluaran', cls: 'pl-5' },
                    { key: 'is_monthly'   as ExpenseSortKey, label: 'Tipe',             cls: '' },
                    { key: 'expense_date' as ExpenseSortKey, label: 'Tanggal',          cls: '' },
                    { key: null,                             label: 'Keterangan',       cls: '' },
                    { key: 'amount'       as ExpenseSortKey, label: 'Jumlah',           cls: 'text-right pr-5' },
                  ] as { key: ExpenseSortKey | null; label: string; cls: string }[]).map(({ key, label, cls }) => (
                    <TableHead
                      key={label}
                      className={`text-xs font-semibold uppercase tracking-wide text-muted-foreground ${key ? 'cursor-pointer select-none hover:text-foreground transition-colors' : ''} ${cls}`}
                      onClick={() => key && handleExpenseSort(key)}
                    >
                      {label}
                      {key && <SortIcon col={key} sortKey={expenseSortKey} sortDir={expenseSortDir} />}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                      Tidak ada data yang cocok dengan pencarian.
                    </TableCell>
                  </TableRow>
                ) : processedExpenses.map((expense) => (
                  <TableRow key={expense.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                    <TableCell className="pl-5 font-medium text-sm">{expense.expense_name}</TableCell>
                    <TableCell>
                      {expense.is_monthly ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Rutin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 ring-1 ring-orange-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />Insidental
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(expense.expense_date)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{expense.description ?? '—'}</TableCell>
                    <TableCell className="text-sm font-semibold text-red-600 text-right pr-5">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>            </div>
            </div>          )}
        </div>
      )}
        </TabsContent>
      </Tabs>
    </div>



  )
}
