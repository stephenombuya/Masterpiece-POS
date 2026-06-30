import { useState, useEffect, useCallback } from 'react'
import { productService } from '@/services/productService'
import type { Product, Category } from '@/types'
import toast from 'react-hot-toast'

export function useProducts() {
  const [products, setProducts]   = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [prods, cats] = await Promise.all([
        productService.getAll(),
        productService.getCategories(),
      ])
      setProducts(prods)
      setCategories(cats)
      setError(null)
    } catch {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createProduct = async (data: Parameters<typeof productService.create>[0]) => {
    const p = await productService.create(data)
    setProducts(prev => [...prev, p])
    toast.success('Product created')
    return p
  }

  const updateProduct = async (id: number, data: Parameters<typeof productService.update>[1]) => {
    const p = await productService.update(id, data)
    setProducts(prev => prev.map(x => x.id === id ? p : x))
    toast.success('Product updated')
    return p
  }

  const deleteProduct = async (id: number) => {
    await productService.delete(id)
    setProducts(prev => prev.filter(x => x.id !== id))
    toast.success('Product deactivated')
  }

  return { products, categories, loading, error, reload: load, createProduct, updateProduct, deleteProduct }
}
