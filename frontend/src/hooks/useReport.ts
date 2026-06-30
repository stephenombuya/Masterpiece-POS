import { useState, useCallback } from 'react'
import { reportService } from '@/services/reportService'
import type { ReportData } from '@/types'
import { todayISO } from '@/utils'

export function useReport() {
  const [report, setReport]   = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async (from: string, to: string) => {
    try {
      setLoading(true)
      setError(null)
      setReport(await reportService.getCustom(from, to))
    } catch {
      setError('Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadToday = useCallback(() => {
    const t = todayISO()
    return load(t, t)
  }, [load])

  return { report, loading, error, load, loadToday }
}
