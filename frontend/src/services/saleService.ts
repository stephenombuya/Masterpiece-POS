import api from './api'
import type { Sale, SaleRequest } from '@/types'

export const saleService = {
  create: async (data: SaleRequest): Promise<Sale> => {
    const res = await api.post<Sale>('/sales', data)
    return res.data
  },

  getAll: async (): Promise<Sale[]> => {
    const res = await api.get<Sale[]>('/sales')
    return res.data
  },

  getById: async (id: number): Promise<Sale> => {
    const res = await api.get<Sale>(`/sales/${id}`)
    return res.data
  },

  getToday: async (): Promise<Sale[]> => {
    const res = await api.get<Sale[]>('/sales/today')
    return res.data
  },

  voidSale: async (id: number, reason: string): Promise<void> => {
    await api.post(`/sales/${id}/void`, { reason })
  },

  getReceipt: (id: number): string => `/api/sales/${id}/receipt`,
}
