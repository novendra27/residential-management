import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Building2,
  Home,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { reportService } from '@/services/report.service'
import { houseService } from '@/services/house.service'
import { residentService } from '@/services/resident.service'
import { billService } from '@/services/bill.service'
import { formatCurrency, formatDate, MONTH_NAMES } from '@/lib/utils'

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1

// ── Custom chart tooltip ─────────────────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; fill?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-border/60 rounded-xl shadow-lg px-4 py-3 text-sm space-y-1.5 min-w-44">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-5">
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-medium" style={{ color: p.fill }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: housesResult, isLoading: housesLoading } = useQuery({
    queryKey: ['houses', 1],
    queryFn: async () => {
      const result = await houseService.getAll(1)
      if (!result.ok) throw new Error(result.message)
      return result
    },
  })

  const { data: residentsResult, isLoading: residentsLoading } = useQuery({
    queryKey: ['residents', 1],
    queryFn: async () => {
      const result = await residentService.getAll(1)
      if (!result.ok) throw new Error(result.message)
      return result
    },
  })

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['report-summary', CURRENT_YEAR],
    queryFn: async () => {
      const result = await reportService.getSummary(CURRENT_YEAR)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['report-balances', CURRENT_MONTH, CURRENT_YEAR],
    queryFn: async () => {
      const result = await reportService.getBalances(CURRENT_MONTH, CURRENT_YEAR)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })

  const { data: unpaidResult } = useQuery({
    queryKey: ['bills', { is_paid: false, month: CURRENT_MONTH, year: CURRENT_YEAR }],
    queryFn: async () => {
      const result = await billService.getAll({ is_paid: false, month: CURRENT_MONTH, year: CURRENT_YEAR })
      if (!result.ok) throw new Error(result.message)
      return result
    },
  })

  // ── Computed values ──────────────────────────────────────────────────────
  const totalHouses = housesResult?.meta?.total ?? 0
  const allOnOnePage =
    housesResult !== undefined &&
    (housesResult.meta?.total ?? 0) <= (housesResult.meta?.per_page ?? 15)
  const occupiedHouses = housesResult?.data.filter((h) => h.is_occupied).length ?? 0
  const emptyHouses = allOnOnePage
    ? (housesResult?.data.filter((h) => !h.is_occupied).length ?? 0)
    : totalHouses - occupiedHouses

  const totalResidents = residentsResult?.meta?.total ?? 0
  const unpaidCount = unpaidResult?.meta?.total ?? 0

  // Chart: months up to current month in current year (max 6)
  const chartData = (summaryData ?? [])
    .filter((row) => row.month <= CURRENT_MONTH)
    .slice(-6)
    .map((row) => ({
      name: MONTH_NAMES[row.month]?.slice(0, 3) ?? String(row.month),
      Pemasukan: row.total_income,
      Pengeluaran: row.total_expense,
    }))

  const recentIncomes = balanceData?.incomes.slice(0, 5) ?? []
  const recentExpenses = balanceData?.expenses.slice(0, 5) ?? []

  const isLoadingTop = housesLoading || residentsLoading

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* ── Unpaid bills alert ── */}
      {unpaidCount > 0 && (
        <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              Terdapat{' '}
              <span className="font-bold">{unpaidCount} tagihan belum lunas</span> pada{' '}
              {MONTH_NAMES[CURRENT_MONTH]} {CURRENT_YEAR}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
          >
            <Link to="/bills">
              Lihat Tagihan <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* ── Property stat cards ── */}
      <div className="grid grid-cols-4 gap-4">
        {isLoadingTop
          ? [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-border/60 shadow-sm h-28 flex items-center justify-center"
              >
                <LoadingSpinner />
              </div>
            ))
          : (
              [
                {
                  label: 'Total Rumah',
                  value: totalHouses,
                  sub: 'unit terdaftar',
                  Icon: Building2,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50',
                },
                {
                  label: 'Rumah Dihuni',
                  value: occupiedHouses,
                  sub: 'unit berpenghuni',
                  Icon: Home,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                },
                {
                  label: 'Rumah Kosong',
                  value: emptyHouses,
                  sub: 'unit tersedia',
                  Icon: Building2,
                  color: 'text-orange-600',
                  bg: 'bg-orange-50',
                },
                {
                  label: 'Total Penghuni',
                  value: totalResidents,
                  sub: 'penghuni terdaftar',
                  Icon: Users,
                  color: 'text-violet-600',
                  bg: 'bg-violet-50',
                },
              ] as const
            ).map(({ label, value, sub, Icon, color, bg }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-border/60 shadow-sm px-6 py-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {label}
                    </p>
                    <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* ── Finance stat cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {balanceLoading
          ? [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-border/60 shadow-sm h-28 flex items-center justify-center"
              >
                <LoadingSpinner />
              </div>
            ))
          : (() => {
              const balance = balanceData?.ending_balance ?? 0
              return (
                [
                  {
                    label: `Pemasukan ${MONTH_NAMES[CURRENT_MONTH]}`,
                    value: balanceData?.total_income ?? 0,
                    Icon: TrendingUp,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                  },
                  {
                    label: `Pengeluaran ${MONTH_NAMES[CURRENT_MONTH]}`,
                    value: balanceData?.total_expense ?? 0,
                    Icon: TrendingDown,
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                  },
                  {
                    label: 'Saldo Bulan Ini',
                    value: balance,
                    Icon: Wallet,
                    color: balance >= 0 ? 'text-blue-600' : 'text-red-600',
                    bg: balance >= 0 ? 'bg-blue-50' : 'bg-red-50',
                  },
                ] as const
              ).map(({ label, value, Icon, color, bg }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-border/60 shadow-sm px-6 py-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                      </p>
                      <p className={`text-2xl font-bold mt-2 ${color}`}>
                        {formatCurrency(value)}
                      </p>
                    </div>
                    <div className={`rounded-xl p-2.5 ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                  </div>
                </div>
              ))
            })()}
      </div>

      {/* ── Trend chart ── */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Tren Keuangan</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pemasukan vs pengeluaran 6 bulan terakhir
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
            <Link to="/report">
              Laporan lengkap <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        <div className="px-6 py-5">
          {summaryLoading ? (
            <div className="h-52 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-52 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Belum ada data transaksi tahun ini.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v: number) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}jt`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}rb`
                        : String(v)
                  }
                  tick={{ fontSize: 11 }}
                  width={52}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Pemasukan" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Pengeluaran" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent transactions ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent incomes */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Pemasukan Terbaru</h3>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-7 px-2 gap-1"
            >
              <Link to="/report">
                Semua <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          {balanceLoading ? (
            <div className="py-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : recentIncomes.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">
              Belum ada pemasukan bulan ini.
            </p>
          ) : (
            <div className="divide-y divide-border/40">
              {recentIncomes.map((income) => (
                <div
                  key={income.payment_id}
                  className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Rumah {income.house.house_number}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {income.resident.full_name} · {formatDate(income.payment_date)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700 shrink-0">
                    {formatCurrency(income.amount_paid)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent expenses */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Pengeluaran Terbaru</h3>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-7 px-2 gap-1"
            >
              <Link to="/expenses">
                Semua <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          {balanceLoading ? (
            <div className="py-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : recentExpenses.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">
              Belum ada pengeluaran bulan ini.
            </p>
          ) : (
            <div className="divide-y divide-border/40">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {expense.expense_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(expense.expense_date)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-red-600 shrink-0">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
