import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { residentService } from '@/services/resident.service'
import { formatDate } from '@/lib/utils'

// Avatar inisial dari nama
function AvatarInitial({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-emerald-100 text-emerald-700',
    'bg-orange-100 text-orange-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
  ]
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${color}`}>
      {initials}
    </div>
  )
}

export default function ResidentList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['residents', page],
    queryFn: async () => {
      const result = await residentService.getAll(page)
      if (!result.ok) throw new Error(result.message)
      return result
    },
  })

  const residents = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Penghuni</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta ? `${meta.total} penghuni terdaftar` : 'Kelola data penghuni perumahan'}
          </p>
        </div>
        <Button onClick={() => navigate('/residents/new')} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Tambah Penghuni
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <ErrorMessage message={error?.message ?? 'Gagal memuat data penghuni.'} />
      ) : residents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Users className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">Belum ada data penghuni</p>
            <p className="text-sm text-muted-foreground mt-1">Mulai dengan menambahkan penghuni pertama</p>
          </div>
          <Button onClick={() => navigate('/residents/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Penghuni
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pl-5">Penghuni</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">No. HP</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status Hunian</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status Kawin</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Terdaftar</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {residents.map((resident) => (
                  <TableRow
                    key={resident.id}
                    className="cursor-pointer hover:bg-blue-50/50 transition-colors border-b border-border/40 last:border-0"
                    onClick={() => navigate(`/residents/${resident.id}`)}
                  >
                    <TableCell className="py-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <AvatarInitial name={resident.full_name} />
                        <span className="font-semibold text-sm text-foreground">{resident.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{resident.phone_number}</TableCell>
                    <TableCell>
                      {resident.is_contract ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Kontrak
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Tetap
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        resident.is_married
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                          : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
                      }`}>
                        {resident.is_married ? 'Menikah' : 'Lajang'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(resident.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-primary font-medium hover:text-primary hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/residents/${resident.id}`)
                        }}
                      >
                        Lihat →
                      </Button>
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
