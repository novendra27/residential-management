import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Calendar, CreditCard, Home, Pencil, Trash2, User, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { PayBillModal } from './PayBillModal'
import { billService } from '@/services/bill.service'
import { formatCurrency, formatDate, formatPeriod } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export default function BillDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: bill, isLoading, isError, error } = useQuery({
    queryKey: ['bill', id],
    queryFn: async () => {
      const result = await billService.getById(id!)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    enabled: Boolean(id),
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await billService.delete(id!)
    setIsDeleting(false)
    if (!result.ok) {
      toast.error(result.message)
      setConfirmOpen(false)
      return
    }
    toast.success('Tagihan berhasil dihapus.')
    queryClient.invalidateQueries({ queryKey: ['bills'] })
    navigate('/bills')
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message={error?.message ?? 'Gagal memuat data.'} />
  if (!bill) return null

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate('/bills')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Tagihan
      </button>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600" />
        <div className="px-8 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="ring-4 ring-white rounded-full h-20 w-20 bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <CreditCard className="h-9 w-9" />
            </div>
            <div className="flex gap-2 mb-1">
              {!bill.is_paid && (
                <Button
                  size="sm"
                  onClick={() => setPayOpen(true)}
                  className="gap-1.5 shadow-sm"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  Bayar Sekarang
                </Button>
              )}
              {!bill.is_paid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/bills/${id}/edit`)}
                  className="gap-1.5 bg-white shadow-sm"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
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

          <h2 className="text-2xl font-bold">Tagihan {bill.fee_type.fee_name}</h2>
          <p className="text-sm text-muted-foreground mt-1">{formatPeriod(bill.period_start, bill.period_end)}</p>
          <div className="flex items-center gap-2 mt-2">
            {bill.is_paid ? (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Lunas
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-red-200">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Belum Lunas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Rumah */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Rumah</h3>
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Home className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p
                className="text-sm font-semibold text-primary cursor-pointer hover:underline"
                onClick={() => navigate(`/houses/${bill.house.id}`)}
              >
                {bill.house.house_number}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{bill.house.address ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Penghuni */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Penghuni</h3>
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              {bill.resident ? (
                <p
                  className="text-sm font-semibold text-primary cursor-pointer hover:underline"
                  onClick={() => navigate(`/residents/${bill.resident!.id}`)}
                >
                  {bill.resident.full_name}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">—</p>
              )}
            </div>
          </div>
        </div>

        {/* Pembayaran */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pembayaran</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Jumlah Tagihan</p>
                <p className="text-sm font-semibold mt-0.5">{formatCurrency(bill.total_amount)}</p>
              </div>
            </div>
            {bill.is_paid && bill.payment_date && (
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal Bayar</p>
                  <p className="text-sm font-semibold mt-0.5">{formatDate(bill.payment_date)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {payOpen && (
        <PayBillModal
          bill={bill}
          open={payOpen}
          onClose={() => setPayOpen(false)}
          onSuccess={() => {
            setPayOpen(false)
            queryClient.invalidateQueries({ queryKey: ['bill', id] })
            queryClient.invalidateQueries({ queryKey: ['bills'] })
          }}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Hapus Tagihan"
        description="Apakah Anda yakin ingin menghapus tagihan ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  )
}
