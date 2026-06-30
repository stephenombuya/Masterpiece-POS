import api from './api'
import type { ReportData } from '@/types'

export const reportService = {
  getDaily: async (date: string): Promise<ReportData> => {
    const res = await api.get<ReportData>('/reports/daily', { params: { date } })
    return res.data
  },

  getWeekly: async (weekStart: string): Promise<ReportData> => {
    const res = await api.get<ReportData>('/reports/weekly', { params: { weekStart } })
    return res.data
  },

  getCustom: async (from: string, to: string): Promise<ReportData> => {
    const res = await api.get<ReportData>('/reports/custom', { params: { from, to } })
    return res.data
  },
}
