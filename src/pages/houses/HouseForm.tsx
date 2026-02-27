import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { houseService } from '@/services/house.service'
import { residentService } from '@/services/resident.service'
import { useToast } from '@/hooks/useToast'

const schema = z.object({
  house_number: z.string().min(1, 'Nomor rumah wajib diisi'),
  address: z.string().optional(),
  occupant_id: z.string().optional(),
  move_in_date: z.string().optional(),
  move_out_date: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function HouseForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [selectedOccupant, setSelectedOccupant] = useState<string>('0')

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const { data: existingData, isFetching } = useQuery({
    queryKey: ['house', id],
    queryFn: async () => {
      const result = await houseService.getById(id!)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    enabled: isEdit,
  })

  const { data: residentsData } = useQuery({
    queryKey: ['residents-dropdown'],
    queryFn: async () => {
      const result = await residentService.getAll(1)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
  const residents = residentsData ?? []

  // Track original occupant to detect changes
  const originalOccupantId = existingData?.current_resident?.resident.id ?? '0'

  useEffect(() => {
    if (existingData) {
      const occ = existingData.current_resident?.resident.id ?? '0'
      reset({
        house_number: existingData.house_number,
        address: existingData.address ?? '',
        occupant_id: occ,
      })
      setSelectedOccupant(occ)
    }
  }, [existingData, reset])

  // Determine which extra fields to show
  const isAssigningNew = selectedOccupant !== '0' && selectedOccupant !== originalOccupantId
  const isUnassigning = selectedOccupant === '0' && originalOccupantId !== '0'
  const showMoveInDate = isAssigningNew
  const showMoveOutDate = isEdit && isUnassigning

  const onSubmit = async (values: FormValues) => {
    // Validate move_in_date when required
    if (showMoveInDate && !isEdit && !values.move_in_date) {
      toast.error('Tanggal masuk wajib diisi saat menugaskan penghuni.')
      return
    }
    if (showMoveInDate && isEdit && originalOccupantId === '0' && !values.move_in_date) {
      toast.error('Tanggal masuk wajib diisi saat menugaskan penghuni.')
      return
    }

    setIsSaving(true)

    // Step 1: Save house data (number & address only, is_occupied is managed by assign endpoints)
    const housePayload = {
      house_number: values.house_number,
      address: values.address || undefined,
    }
    const houseResult = isEdit
      ? await houseService.update(id!, housePayload)
      : await houseService.create(housePayload)

    if (!houseResult.ok) {
      toast.error(houseResult.message)
      setIsSaving(false)
      return
    }

    const houseId = isEdit ? id! : houseResult.data.id
    const newOccupant = values.occupant_id ?? '0'

    // Step 2: Handle occupant assignment
    if (!isEdit) {
      // Create mode: assign if a resident was selected
      if (newOccupant !== '0') {
        const assignResult = await houseService.assign(houseId, {
          resident_id: newOccupant,
          move_in_date: values.move_in_date!,
        })
        if (!assignResult.ok) {
          toast.error(assignResult.message)
          setIsSaving(false)
          return
        }
      }
    } else {
      // Edit mode
      if (originalOccupantId === '0' && newOccupant !== '0') {
        // Was empty â†’ assign new resident
        const assignResult = await houseService.assign(houseId, {
          resident_id: newOccupant,
          move_in_date: values.move_in_date!,
        })
        if (!assignResult.ok) {
          toast.error(assignResult.message)
          setIsSaving(false)
          return
        }
      } else if (originalOccupantId !== '0' && newOccupant === '0') {
        // Was occupied â†’ unassign (move-out)
        const unassignResult = await houseService.unassign(houseId, {
          move_out_date: values.move_out_date || undefined,
        })
        if (!unassignResult.ok) {
          toast.error(unassignResult.message)
          setIsSaving(false)
          return
        }
      } else if (originalOccupantId !== '0' && newOccupant !== '0' && originalOccupantId !== newOccupant) {
        // Change to a different resident
        const updateResult = await houseService.updateAssign(houseId, {
          resident_id: newOccupant,
          move_in_date: values.move_in_date || undefined,
        })
        if (!updateResult.ok) {
          toast.error(updateResult.message)
          setIsSaving(false)
          return
        }
      }
      // else: same resident, no occupant action needed
    }

    setIsSaving(false)
    toast.success(isEdit ? 'Data rumah berhasil diperbarui.' : 'Rumah berhasil ditambahkan.')
    queryClient.invalidateQueries({ queryKey: ['houses'] })
    if (isEdit) queryClient.invalidateQueries({ queryKey: ['house', id] })
    navigate(isEdit ? `/houses/${id}` : '/houses')
  }

  if (isEdit && isFetching) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(isEdit ? `/houses/${id}` : '/houses')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {isEdit ? 'Kembali ke Detail' : 'Kembali ke Daftar'}
      </button>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-border/60 bg-muted/20">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Data Rumah' : 'Tambah Rumah Baru'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEdit ? 'Perbarui informasi rumah di bawah ini.' : 'Isi formulir berikut untuk mendaftarkan rumah baru.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-6">
          {/* Row 1: Nomor Rumah + Alamat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="house_number" className="text-sm font-medium">Nomor Rumah</Label>
              <Input
                id="house_number"
                placeholder="Contoh: A-01"
                className="h-10"
                {...register('house_number')}
              />
              {errors.house_number && (
                <p className="text-xs text-destructive">{errors.house_number.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm font-medium">
                Alamat <span className="text-muted-foreground font-normal">(opsional)</span>
              </Label>
              <Input
                id="address"
                placeholder="Contoh: Jl. Mawar No. 1"
                className="h-10"
                {...register('address')}
              />
            </div>
          </div>

          {/* Row 2: Penghuni */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Status Hunian</Label>
            <Select
              defaultValue={isEdit ? (existingData?.current_resident?.resident.id ?? '0') : '0'}
              onValueChange={(v) => {
                setValue('occupant_id', v)
                setSelectedOccupant(v)
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Pilih penghuni" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Tidak Dihuni</SelectItem>
                {residents.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEdit && originalOccupantId !== '0' && selectedOccupant === originalOccupantId && (
              <p className="text-xs text-muted-foreground">
                Penghuni aktif saat ini. Pilih penghuni lain untuk mengganti, atau pilih &ldquo;Tidak Dihuni&rdquo; untuk move-out.
              </p>
            )}
          </div>

          {/* Tanggal Masuk â€” muncul saat menugaskan penghuni baru */}
          {showMoveInDate && (
            <div className="space-y-1.5">
              <Label htmlFor="move_in_date" className="text-sm font-medium">
                Tanggal Masuk
                {!isEdit || originalOccupantId === '0' ? (
                  <span className="text-destructive ml-1">*</span>
                ) : (
                  <span className="text-muted-foreground font-normal ml-1">(opsional)</span>
                )}
              </Label>
              <Input
                id="move_in_date"
                type="date"
                className="h-10"
                {...register('move_in_date')}
              />
            </div>
          )}

          {/* Tanggal Keluar â€” muncul saat move-out */}
          {showMoveOutDate && (
            <div className="space-y-1.5">
              <Label htmlFor="move_out_date" className="text-sm font-medium">
                Tanggal Keluar
                <span className="text-muted-foreground font-normal ml-1">(opsional default: hari ini)</span>
              </Label>
              <Input
                id="move_out_date"
                type="date"
                className="h-10"
                {...register('move_out_date')}
              />
            </div>
          )}

          <div className="border-t border-border/60" />

          <div className="flex gap-3">
            <Button type="submit" disabled={isSaving} className="flex-1 h-10 shadow-sm">
              {isSaving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Rumah'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEdit ? `/houses/${id}` : '/houses')}
              disabled={isSaving}
              className="flex-1 h-10"
            >
              Batal
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
