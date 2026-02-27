import { api } from '@/lib/apiClient'
import type { House, ResidentHistory, PaymentHistory } from '@/types'

export const houseService = {
  getAll: (page = 1) =>
    api.get<House[]>('/houses', { page }),

  getById: (id: string) =>
    api.get<House>(`/houses/${id}`),

  getResidentHistories: (id: string, page = 1) =>
    api.get<ResidentHistory[]>(`/houses/${id}/resident_histories`, { page }),

  getPaymentHistories: (id: string, page = 1) =>
    api.get<PaymentHistory[]>(`/houses/${id}/payment_histories`, { page }),

  create: (data: { house_number: string; address?: string; is_occupied?: boolean }) =>
    api.post<House>('/houses', data as Record<string, unknown>),

  update: (id: string, data: Partial<{ house_number: string; address: string; is_occupied: boolean }>) =>
    api.put<House>(`/houses/${id}`, data as Record<string, unknown>),

  delete: (id: string) =>
    api.delete<null>(`/houses/${id}`),

  // POST /houses/{id}/assign — tugaskan penghuni ke rumah kosong
  assign: (id: string, data: { resident_id: string; move_in_date: string }) =>
    api.post<ResidentHistory>(`/houses/${id}/assign`, data as Record<string, unknown>),

  // PUT /houses/{id}/assign — perbarui hunian aktif (ganti penghuni / koreksi tanggal masuk)
  updateAssign: (id: string, data: { resident_id?: string; move_in_date?: string }) =>
    api.put<ResidentHistory>(`/houses/${id}/assign`, data as Record<string, unknown>),

  // DELETE /houses/{id}/assign — keluarkan penghuni aktif (move-out)
  unassign: (id: string, data?: { move_out_date?: string }) =>
    api.delete<ResidentHistory>(`/houses/${id}/assign`, data as Record<string, unknown>),
}
