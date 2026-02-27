import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ArrowUpDown, Home, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { houseService } from '@/services/house.service'
import type { House } from '@/types'

type HouseSortKey = 'house_number' | 'address' | 'is_occupied'

function SortIcon({ col, sortKey, sortDir }: { col: HouseSortKey; sortKey: HouseSortKey | null; sortDir: 'asc' | 'desc' }) {
  if (sortKey !== col) return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />
  return sortDir === 'asc'
    ? <ArrowUp className="ml-1 h-3 w-3 inline text-primary" />
    : <ArrowDown className="ml-1 h-3 w-3 inline text-primary" />
}

export default function HouseList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<HouseSortKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['houses', page],
    queryFn: async () => {
      const result = await houseService.getAll(page)
      if (!result.ok) throw new Error(result.message)
      return result
    },
  })

  const houses = useMemo(() => data?.data ?? [], [data?.data])
  const meta = data?.meta

  const handleSort = (key: HouseSortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const processed = useMemo(() => {
    const q = search.toLowerCase()
    const list = q
      ? houses.filter(h =>
          h.house_number.toLowerCase().includes(q) ||
          (h.address ?? '').toLowerCase().includes(q)
        )
      : [...houses]
    if (sortKey) {
      list.sort((a, b) => {
        const av = a[sortKey as keyof House], bv = b[sortKey as keyof House]
        const cmp = typeof av === 'boolean'
          ? (av === bv ? 0 : av ? -1 : 1)
          : String(av ?? '').localeCompare(String(bv ?? ''), 'id')
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return list
  }, [houses, search, sortKey, sortDir])

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Rumah</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta ? `${meta.total} rumah terdaftar` : 'Kelola data rumah perumahan'}
          </p>
        </div>
        <Button onClick={() => navigate('/houses/new')} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Tambah Rumah
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari no. rumah atau alamat..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9 bg-white"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <ErrorMessage message={error?.message ?? 'Gagal memuat data rumah.'} />
      ) : houses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Home className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">Belum ada data rumah</p>
            <p className="text-sm text-muted-foreground mt-1">Mulai dengan menambahkan rumah pertama</p>
          </div>
          <Button onClick={() => navigate('/houses/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Rumah
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                  {(['house_number', 'address', 'is_occupied'] as HouseSortKey[]).map((key, i) => {
                    const labels: Record<HouseSortKey, string> = {
                      house_number: 'No. Rumah', address: 'Alamat', is_occupied: 'Status',
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
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">Tidak ada data yang cocok dengan pencarian.</TableCell></TableRow>
                ) : processed.map((house) => (
                  <TableRow
                    key={house.id}
                    className="cursor-pointer hover:bg-blue-50/50 transition-colors border-b border-border/40 last:border-0"
                    onClick={() => navigate(`/houses/${house.id}`)}
                  >
                    <TableCell className="py-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <Home className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-sm text-foreground">{house.house_number}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {house.address ?? <span className="italic text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell>
                      {house.is_occupied ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Dihuni
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-50 text-slate-600 ring-1 ring-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Kosong
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
