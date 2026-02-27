import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Calendar, Home, MapPin, Pencil, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { Pagination } from '@/components/shared/Pagination'
import { houseService } from '@/services/house.service'
import { formatDate, formatCurrency, formatPeriod } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export default function HouseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [paymentPage, setPaymentPage] = useState(1)

  const { data: house, isLoading, isError, error } = useQuery({
    queryKey: ['house', id],
    queryFn: async () => {
      const result = await houseService.getById(id!)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    enabled: Boolean(id),
  })

  const { data: residentHistories } = useQuery({
    queryKey: ['house-resident-histories', id, historyPage],
    queryFn: async () => {
      const result = await houseService.getResidentHistories(id!, historyPage)
      if (!result.ok) throw new Error(result.message)
      return result
    },
    enabled: Boolean(id),
  })

  const { data: paymentHistories } = useQuery({
    queryKey: ['house-payment-histories', id, paymentPage],
    queryFn: async () => {
      const result = await houseService.getPaymentHistories(id!, paymentPage)
      if (!result.ok) throw new Error(result.message)
      return result
    },
    enabled: Boolean(id),
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await houseService.delete(id!)
    setIsDeleting(false)
    if (!result.ok) {
      toast.error(result.message)
      setConfirmOpen(false)
      return
    }
    toast.success('Rumah berhasil dihapus.')
    queryClient.invalidateQueries({ queryKey: ['houses'] })
    navigate('/houses')
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message={error?.message ?? 'Gagal memuat data.'} />
  if (!house) return null

  const cr = house.current_resident

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate('/houses')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Daftar Rumah
      </button>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600" />
        <div className="px-8 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="ring-4 ring-white rounded-full h-20 w-20 bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Home className="h-9 w-9" />
            </div>
            <div className="flex gap-2 mb-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/houses/${id}/edit`)}
                className="gap-1.5 bg-white shadow-sm"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                className="gap-1.5 shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus
              </Button>
            </div>
          </div>

          <h2 className="text-2xl font-bold">Rumah {house.house_number}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {house.is_occupied ? (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Dihuni
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-slate-50 text-slate-600 ring-1 ring-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Tidak Dihuni
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Rumah info */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informasi Rumah</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Home className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nomor Rumah</p>
                <p className="text-sm font-semibold mt-0.5">{house.house_number}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Alamat</p>
                <p className="text-sm font-semibold mt-0.5">{house.address ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Terdaftar Sejak</p>
                <p className="text-sm font-semibold mt-0.5">{formatDate(house.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Penghuni aktif */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Penghuni Aktif</h3>
          {cr ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {cr.resident.full_name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                </div>
                <div>
                  <p
                    className="text-sm font-semibold text-primary cursor-pointer hover:underline"
                    onClick={() => navigate(`/residents/${cr.resident.id}`)}
                  >
                    {cr.resident.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{cr.resident.phone_number}</p>
                </div>
              </div>
              <div className="border-t border-border/50 pt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Status Hunian</span>
                  <span className="font-medium">{cr.resident.is_contract ? 'Kontrak' : 'Tetap'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Masuk Sejak</span>
                  <span className="font-medium">{formatDate(cr.move_in_date)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-border gap-2">
              <User className="h-7 w-7 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">Tidak ada penghuni</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs: riwayat */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <Tabs defaultValue="residents" className="w-full">
          <div className="border-b border-border/60 px-6">
            <TabsList className="h-12 bg-transparent gap-1 p-0">
              <TabsTrigger
                value="residents"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-12 px-4 text-sm font-medium"
              >
                Riwayat Penghuni
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-12 px-4 text-sm font-medium"
              >
                Riwayat Tagihan
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Riwayat Penghuni */}
          <TabsContent value="residents" className="p-0 m-0">
            {!residentHistories ? (
              <div className="p-6"><LoadingSpinner /></div>
            ) : residentHistories.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-2">
                <p className="text-sm text-muted-foreground">Belum ada riwayat penghuni.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pl-6">Penghuni</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Masuk</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Keluar</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {residentHistories.data.map((h) => (
                      <TableRow key={h.id} className="border-b border-border/40 last:border-0">
                        <TableCell className="py-3.5 pl-6">
                          <p
                            className="text-sm font-semibold text-primary cursor-pointer hover:underline"
                            onClick={() => navigate(`/residents/${h.resident.id}`)}
                          >
                            {h.resident.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{h.resident.phone_number}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(h.move_in_date)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {h.move_out_date ? formatDate(h.move_out_date) : '—'}
                        </TableCell>
                        <TableCell>
                          {h.is_active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-50 text-slate-600 ring-1 ring-slate-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Tidak Aktif
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {residentHistories.meta && (
                  <div className="px-6 py-4">
                    <Pagination
                      currentPage={residentHistories.meta.current_page}
                      lastPage={residentHistories.meta.last_page}
                      onPageChange={setHistoryPage}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Riwayat Tagihan */}
          <TabsContent value="payments" className="p-0 m-0">
            {!paymentHistories ? (
              <div className="p-6"><LoadingSpinner /></div>
            ) : paymentHistories.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-2">
                <p className="text-sm text-muted-foreground">Belum ada riwayat tagihan.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pl-6">Penghuni</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jenis Iuran</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Periode</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jumlah</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistories.data.map((p) => (
                      <TableRow key={p.bill_id} className="border-b border-border/40 last:border-0">
                        <TableCell className="py-3.5 pl-6 text-sm font-medium">{p.resident.full_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.fee_type.fee_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatPeriod(p.period_start, p.period_end)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{formatCurrency(p.total_amount)}</TableCell>
                        <TableCell>
                          {p.is_paid ? (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {paymentHistories.meta && (
                  <div className="px-6 py-4">
                    <Pagination
                      currentPage={paymentHistories.meta.current_page}
                      lastPage={paymentHistories.meta.last_page}
                      onPageChange={setPaymentPage}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Hapus Rumah"
        description={`Apakah Anda yakin ingin menghapus rumah "${house.house_number}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  )
}
