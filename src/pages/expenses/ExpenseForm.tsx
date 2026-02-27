import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { expenseService } from '@/services/expense.service'
import { useToast } from '@/hooks/useToast'

// ─── Schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  expense_name: z.string().min(1, 'Nama pengeluaran wajib diisi'),
  expense_date: z.string().min(1, 'Tanggal wajib diisi'),
  amount: z
    .string()
    .min(1, 'Jumlah wajib diisi')
    .refine(v => !isNaN(Number(v)) && Number(v) > 0, 'Jumlah harus lebih dari 0'),
  description: z.string().optional(),
  is_monthly: z.enum(['true', 'false'], { message: 'Tipe pengeluaran wajib dipilih' }),
})

type FormValues = z.infer<typeof schema>

// ─── Component ─────────────────────────────────────────────────────────────
export default function ExpenseForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: expenseData, isLoading: isFetching } = useQuery({
    queryKey: ['expense', id],
    queryFn: async () => {
      const result = await expenseService.getById(id!)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    enabled: isEdit,
  })

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (expenseData) {
      reset({
        expense_name: expenseData.expense_name,
        expense_date: expenseData.expense_date,
        amount: String(expenseData.amount),
        description: expenseData.description ?? '',
        is_monthly: expenseData.is_monthly ? 'true' : 'false',
      })
    }
  }, [expenseData, reset])

  const onSubmit = async (values: FormValues) => {
    const payload = {
      expense_name: values.expense_name,
      expense_date: values.expense_date,
      amount: Number(values.amount),
      description: values.description?.trim() || undefined,
      is_monthly: values.is_monthly === 'true',
    }

    const result = isEdit
      ? await expenseService.update(id!, payload)
      : await expenseService.create(payload as { expense_name: string; expense_date: string; amount: number; description?: string; is_monthly: boolean })

    if (!result.ok) {
      toast.error(result.message)
      return
    }

    queryClient.invalidateQueries({ queryKey: ['expenses'] })
    if (isEdit) queryClient.invalidateQueries({ queryKey: ['expense', id] })

    toast.success(isEdit ? 'Data pengeluaran berhasil diperbarui.' : 'Pengeluaran berhasil dicatat.')
    navigate('/expenses')
  }

  if (isEdit && isFetching) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate('/expenses')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Daftar
      </button>

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-8 py-5 border-b border-border/60 bg-muted/20">
          <h2 className="text-lg font-semibold">
            {isEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEdit
              ? 'Perbarui data pengeluaran di bawah ini.'
              : 'Isi formulir berikut untuk mencatat pengeluaran baru.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-6">
          {/* Nama & Tipe */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="expense_name" className="text-sm font-medium">Nama Pengeluaran</Label>
              <Input
                id="expense_name"
                placeholder="Contoh: Gaji Satpam"
                className="h-10"
                {...register('expense_name')}
              />
              {errors.expense_name && (
                <p className="text-xs text-destructive">{errors.expense_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tipe Pengeluaran</Label>
              <Select
                defaultValue={expenseData ? (expenseData.is_monthly ? 'true' : 'false') : undefined}
                onValueChange={(v) => setValue('is_monthly', v as 'true' | 'false', { shouldValidate: true })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih tipe..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Rutin Bulanan</SelectItem>
                  <SelectItem value="false">Insidental</SelectItem>
                </SelectContent>
              </Select>
              {errors.is_monthly && (
                <p className="text-xs text-destructive">{errors.is_monthly.message}</p>
              )}
            </div>
          </div>

          {/* Tanggal & Jumlah */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="expense_date" className="text-sm font-medium">Tanggal Pengeluaran</Label>
              <Input
                id="expense_date"
                type="date"
                className="h-10"
                {...register('expense_date')}
              />
              {errors.expense_date && (
                <p className="text-xs text-destructive">{errors.expense_date.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-sm font-medium">Jumlah (Rp)</Label>
              <Input
                id="amount"
                type="number"
                min={1}
                placeholder="Contoh: 1500000"
                className="h-10"
                {...register('amount')}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Keterangan */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">
              Keterangan <span className="text-muted-foreground font-normal">(opsional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Tambahkan catatan atau keterangan..."
              className="resize-none"
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/expenses')}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-28">
              {isSubmitting
                ? (isEdit ? 'Menyimpan...' : 'Mencatat...')
                : (isEdit ? 'Simpan Perubahan' : 'Catat Pengeluaran')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
