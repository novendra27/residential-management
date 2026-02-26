import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Calendar, Pencil, Phone, Trash2, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { residentService } from '@/services/resident.service'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

function AvatarInitial({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return (
    <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold shrink-0">
      {initials}
    </div>
  )
}

export default function ResidentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: resident, isLoading, isError, error } = useQuery({
    queryKey: ['resident', id],
    queryFn: async () => {
      const result = await residentService.getById(id!)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    enabled: Boolean(id),
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await residentService.delete(id!)
    setIsDeleting(false)

    if (!result.ok) {
      toast.error(result.message)
      setConfirmOpen(false)
      return
    }

    toast.success('Penghuni berhasil dihapus.')
    queryClient.invalidateQueries({ queryKey: ['residents'] })
    navigate('/residents')
  }

  if (isLoading) return <LoadingSpinner />
  if (isError) return <ErrorMessage message={error?.message ?? 'Gagal memuat data.'} />
  if (!resident) return null

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={() => navigate('/residents')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Daftar Penghuni
      </button>

      {/* Profile Hero Card */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {/* Top gradient strip */}
        <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600" />

        <div className="px-8 pb-6">
          {/* Avatar + action buttons */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="ring-4 ring-white rounded-full">
              <AvatarInitial name={resident.full_name} />
            </div>
            <div className="flex gap-2 mb-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/residents/${id}/edit`)}
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

          {/* Name + badges */}
          <h2 className="text-2xl font-bold text-foreground">{resident.full_name}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {resident.is_contract ? (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Kontrak
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Tetap
              </span>
            )}
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              resident.is_married
                ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
            }`}>
              {resident.is_married ? 'Menikah' : 'Lajang'}
            </span>
          </div>
        </div>
      </div>

      {/* Info + KTP grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info stats */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-border/60 shadow-sm p-6 space-y-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informasi Kontak</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nomor HP</p>
                <p className="text-sm font-semibold mt-0.5">{resident.phone_number}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Terdaftar Sejak</p>
                <p className="text-sm font-semibold mt-0.5">{formatDate(resident.created_at)}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 pt-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs text-muted-foreground">Status Hunian</p>
                <p className="text-sm font-semibold mt-1">{resident.is_contract ? 'Kontrak' : 'Tetap'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status Perkawinan</p>
                <p className="text-sm font-semibold mt-1">{resident.is_married ? 'Menikah' : 'Belum Menikah'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* KTP Photo */}
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Foto KTP</h3>
          {resident.ktp_photo ? (
            <img
              src={resident.ktp_photo}
              alt="Foto KTP"
              className="w-full rounded-xl border object-cover shadow-sm"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-border gap-2">
              <UserRound className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">Belum diunggah</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Hapus Penghuni"
        description={`Apakah Anda yakin ingin menghapus "${resident.full_name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  )
}

