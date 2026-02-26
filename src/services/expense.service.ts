import { api } from '@/lib/apiClient'
import type { Expense } from '@/types'

export interface ExpenseFilters {
  page?: number
  month?: number
  year?: number
  is_monthly?: boolean
}

export const expenseService = {
  getAll: (filters: ExpenseFilters = {}) =>
    api.get<Expense[]>('/expenses', filters as Record<string, unknown>),

  getById: (id: string) =>
    api.get<Expense>(`/expenses/${id}`),

  create: (data: { expense_name: string; expense_date: string; amount: number; description?: string; is_monthly: boolean }) =>
    api.post<Expense>('/expenses', data as Record<string, unknown>),

  update: (id: string, data: Partial<{ expense_name: string; expense_date: string; amount: number; description: string | null; is_monthly: boolean }>) =>
    api.put<Expense>(`/expenses/${id}`, data as Record<string, unknown>),

  delete: (id: string) =>
    api.delete<null>(`/expenses/${id}`),
}
