import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { billService } from '@/services/bill.service'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import type { Bill } from '@/types'

const schema = z.object({
  payment_date: z.string().min(1, 'Tanggal bayar wajib diisi'),
  amount_paid: z.number().positive('Jumlah bayar harus lebih dari 0'),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface PayBillModalProps {
  bill: Bill
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PayBillModal({ bill, open, onClose, onSuccess }: PayBillModalProps) {
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      amount_paid: bill.total_amount,
    },
  })

  const onSubmit = async (values: FormValues) => {
    const result = await billService.pay(bill.id, {
      payment_date: values.payment_date,
      amount_paid: values.amount_paid,
      notes: values.notes || undefined,
    })
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success('Pembayaran berhasil dicatat.')
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bayar Tagihan</DialogTitle>
        </DialogHeader>

        {/* Bill summary */}
        <div className="bg-muted/40 rounded-xl p-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rumah</span>
            <span className="font-medium">{bill.house.house_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jenis Iuran</span>
            <span className="font-medium">{bill.fee_type.fee_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Tagihan</span>
            <span className="font-semibold text-primary">{formatCurrency(bill.total_amount)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="payment_date" className="text-sm font-medium">Tanggal Pembayaran</Label>
            <Input
              id="payment_date"
              type="date"
              className="h-10"
              {...register('payment_date')}
            />
            {errors.payment_date && (
              <p className="text-xs text-destructive">{errors.payment_date.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount_paid" className="text-sm font-medium">Jumlah Dibayar (Rp)</Label>
            <Input
              id="amount_paid"
              type="number"
              className="h-10"
              {...register('amount_paid', { valueAsNumber: true })}
            />
            {errors.amount_paid && (
              <p className="text-xs text-destructive">{errors.amount_paid.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm font-medium">
              Catatan <span className="font-normal text-muted-foreground">(opsional)</span>
            </Label>
            <Input
              id="notes"
              placeholder="Misal: transfer BCA"
              className="h-10"
              {...register('notes')}
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Bayar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

