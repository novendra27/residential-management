import { api } from '@/lib/apiClient'
import type { Resident } from '@/types'

export const residentService = {
  getAll: (page = 1) =>
    api.get<Resident[]>('/residents', { page }),

  getById: (id: string) =>
    api.get<Resident>(`/residents/${id}`),

  // FormData dikirim apa adanya — Content-Type multipart diatur otomatis oleh browser
  create: (formData: FormData) =>
    api.post<Resident>('/residents', formData),

  // Gunakan POST + _method=PUT karena Laravel tidak support multipart PUT
  update: (id: string, formData: FormData) => {
    formData.append('_method', 'PUT')
    return api.post<Resident>(`/residents/${id}`, formData)
  },

  delete: (id: string) =>
    api.delete<null>(`/residents/${id}`),
}
