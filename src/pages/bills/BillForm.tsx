import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { billService } from '@/services/bill.service'
import { houseService } from '@/services/house.service'
import { feeTypeService } from '@/services/feetype.service'
import { useToast } from '@/hooks/useToast'

type PeriodType = 'monthly' | 'yearly'

// Inferring period type from existing bill data (for edit mode pre-selection)
function inferPeriodType(start: string, end: string): PeriodType {
  const s = new Date(start)
  const lastOfMonth = new Date(s.getFullYear(), s.getMonth() + 1, 0)
  const e = new Date(end)
  if (
    e.getFullYear() === lastOfMonth.getFullYear() &&
    e.getMonth() === lastOfMonth.getMonth() &&
    e.getDate() === lastOfMonth.getDate()
  ) return 'monthly'
  return 'yearly'
}

// Compute period_end from period_start + period type
function computePeriodEnd(start: string, type: PeriodType): string {
  const s = new Date(start)
  if (isNaN(s.getTime())) return ''
  const end = type === 'monthly'
    ? new Date(s.getFullYear(), s.getMonth() + 1, 0)   // last day of same month
    : new Date(s.getFullYear(), 11, 31)                  // Dec 31 of same year
  return end.toISOString().split('T')[0]
}

const schema = z.object({
  house_id: z.string().min(1, 'Rumah wajib dipilih'),
  fee_type_id: z.string().min(1, 'Jenis iuran wajib dipilih'),
  period_start: z.string().min(1, 'Tanggal mulai wajib diisi'),
})

type FormValues = z.infer<typeof schema>

export default function BillForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')

  const { register, handleSubmit, setValue, reset, control, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  // Reactively watch period_start to derive period_end preview
  const periodStart = useWatch({ control, name: 'period_start' }) ?? ''
  const computedPeriodEnd = useMemo(
    () => computePeriodEnd(periodStart, periodType),
    [periodStart, periodType]
  )

  const { data: billData, isFetching } = useQuery({
    queryKey: ['bill', id],
    queryFn: async () => {
      const result = await billService.getById(id!)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    enabled: isEdit,
  })

  const { data: housesData } = useQuery({
    queryKey: ['houses-all'],
    queryFn: async () => {
      const result = await houseService.getAll(1)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })

  const { data: feeTypesData } = useQuery({
    queryKey: ['fee-types'],
    queryFn: async () => {
      const result = await feeTypeService.getAll()
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })

  useEffect(() => {
    if (billData) {
      const start = billData.period_start.split('T')[0]
      const end = billData.period_end.split('T')[0]
      reset({
        house_id: billData.house.id,
        fee_type_id: billData.fee_type.id,
        period_start: start,
      })
      setPeriodType(inferPeriodType(start, end))
    }
  }, [billData, reset])

  const onSubmit = async (values: FormValues) => {
    if (!computedPeriodEnd) {
      toast.error('Tanggal mulai tidak valid.')
      return
    }
    const payload = { ...values, period_end: computedPeriodEnd }
    const result = isEdit
      ? await billService.update(id!, payload)
      : await billService.create(payload)

    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success(isEdit ? 'Tagihan berhasil diperbarui.' : 'Tagihan berhasil dibuat.')
    queryClient.invalidateQueries({ queryKey: ['bills'] })
    if (isEdit) queryClient.invalidateQueries({ queryKey: ['bill', id] })
    navigate(isEdit ? `/bills/${id}` : '/bills')
  }

  if (isEdit && isFetching) return <LoadingSpinner />

  const houses = housesData ?? []
  const feeTypes = feeTypesData ?? []

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(isEdit ? `/bills/${id}` : '/bills')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {isEdit ? 'Kembali ke Detail' : 'Kembali ke Tagihan'}
      </button>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-border/60 bg-muted/20">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Tagihan' : 'Buat Tagihan Baru'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEdit ? 'Perbarui data tagihan di bawah ini.' : 'Isi formulir berikut untuk membuat tagihan iuran baru.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Rumah */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Rumah</Label>
              <Select
                defaultValue={isEdit ? billData?.house.id : undefined}
                onValueChange={(v) => setValue('house_id', v)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih rumah" />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.house_number}{h.address ? ` — ${h.address}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.house_id && (
                <p className="text-xs text-destructive">{errors.house_id.message}</p>
              )}
            </div>

            {/* Jenis Iuran */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Jenis Iuran</Label>
              <Select
                defaultValue={isEdit ? billData?.fee_type.id : undefined}
                onValueChange={(v) => setValue('fee_type_id', v)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih jenis iuran" />
                </SelectTrigger>
                <SelectContent>
                  {feeTypes.map((ft) => (
                    <SelectItem key={ft.id} value={ft.id}>
                      {ft.fee_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fee_type_id && (
                <p className="text-xs text-destructive">{errors.fee_type_id.message}</p>
              )}
            </div>

            {/* Periode Mulai */}
            <div className="space-y-1.5">
              <Label htmlFor="period_start" className="text-sm font-medium">Tanggal Mulai Periode</Label>
              <Input
                id="period_start"
                type="date"
                className="h-10"
                {...register('period_start')}
              />
              {errors.period_start && (
                <p className="text-xs text-destructive">{errors.period_start.message}</p>
              )}
            </div>

            {/* Tipe Periode */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Periode Pembayaran</Label>
              <Select
                value={periodType}
                onValueChange={(v) => setPeriodType(v as PeriodType)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
              {computedPeriodEnd && (
                <p className="text-xs text-muted-foreground">
                  Periode berakhir: <span className="font-medium text-foreground">{computedPeriodEnd}</span>
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-border/60" />

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting} className="flex-1 h-10 shadow-sm">
              {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Tagihan'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEdit ? `/bills/${id}` : '/bills')}
              disabled={isSubmitting}
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

