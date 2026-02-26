import { api } from '@/lib/apiClient'
import type { MonthlySummary, MonthlyBalance } from '@/types'

export const reportService = {
  getSummary: (year: number) =>
    api.get<MonthlySummary[]>('/report/summary', { year }),

  getBalances: (month: number, year: number) =>
    api.get<MonthlyBalance>('/report/balances', { month, year }),
}
