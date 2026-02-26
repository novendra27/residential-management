import { api } from '@/lib/apiClient'
import type { Payment } from '@/types'

export const paymentService = {
  create: (data: { bill_id: string; payment_date: string; amount_paid: number; notes?: string }) =>
    api.post<Payment>('/payments', data as Record<string, unknown>),
}
