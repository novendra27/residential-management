import { api } from '@/lib/apiClient'
import type { Bill } from '@/types'

export interface BillFilters {
  page?: number
  house_id?: string
  fee_type_id?: string
  is_paid?: boolean
  month?: number
  year?: number
}

export const billService = {
  getAll: (filters: BillFilters = {}) =>
    api.get<Bill[]>('/bills', filters as Record<string, unknown>),

  getById: (id: string) =>
    api.get<Bill>(`/bills/${id}`),

  create: (data: { house_id: string; fee_type_id: string; period_start: string; period_end: string }) =>
    api.post<Bill>('/bills', data as Record<string, unknown>),

  update: (id: string, data: Partial<{ house_id: string; fee_type_id: string; period_start: string; period_end: string }>) =>
    api.put<Bill>(`/bills/${id}`, data as Record<string, unknown>),

  pay: (id: string, data: { payment_date: string; amount_paid: number; notes?: string }) =>
    api.patch<Bill>(`/bills/${id}/pay`, data as Record<string, unknown>),

  delete: (id: string) =>
    api.delete<null>(`/bills/${id}`),
}
