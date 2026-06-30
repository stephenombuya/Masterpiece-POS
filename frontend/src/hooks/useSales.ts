import { useState, useEffect, useCallback } from 'react'
import { saleService } from '@/services/saleService'
import type { Sale } from '@/types'

export function useSales() {
  const [sales, setSales]   = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setSales(await saleService.getToday())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { sales, loading, reload: load }
}
