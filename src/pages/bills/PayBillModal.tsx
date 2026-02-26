// TODO: Implement PayBillModal
// - Dialog: payment_date, amount_paid, notes
// - Submit → PATCH /bills/{id}/pay

import type { Bill } from '@/types'

interface PayBillModalProps {
  bill: Bill
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PayBillModal({ open }: PayBillModalProps) {
  if (!open) return null
  return (
    <div>
      {/* TODO: Implement PayBillModal */}
    </div>
  )
}
