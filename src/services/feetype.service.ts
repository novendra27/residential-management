import { api } from '@/lib/apiClient'
import type { ApiResult } from '@/lib/apiClient'
import type { FeeType, Bill } from '@/types'

export const feeTypeService = {
  // The backend has no dedicated /fee_types endpoint.
  // We extract unique fee types from the bills list instead.
  getAll: async (): Promise<ApiResult<FeeType[]>> => {
    const result = await api.get<Bill[]>('/bills')
    if (!result.ok) return result

    const seen = new Set<string>()
    const feeTypes: FeeType[] = []
    for (const bill of result.data) {
      if (bill.fee_type && !seen.has(bill.fee_type.id)) {
        seen.add(bill.fee_type.id)
        feeTypes.push(bill.fee_type)
      }
    }
    return { ok: true, data: feeTypes }
  },
}
