import api from './api'
import type { Product, ProductFormData, Category } from '@/types'

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const res = await api.get<Product[]>('/products')
    return res.data
  },

  search: async (query: string): Promise<Product[]> => {
    const res = await api.get<Product[]>('/products/search', { params: { q: query } })
    return res.data
  },

  getById: async (id: number): Promise<Product> => {
    const res = await api.get<Product>(`/products/${id}`)
    return res.data
  },

  getByBarcode: async (barcode: string): Promise<Product> => {
    const res = await api.get<Product>(`/products/barcode/${barcode}`)
    return res.data
  },

  create: async (data: ProductFormData): Promise<Product> => {
    const res = await api.post<Product>('/products', data)
    return res.data
  },

  update: async (id: number, data: ProductFormData): Promise<Product> => {
    const res = await api.put<Product>(`/products/${id}`, data)
    return res.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`)
  },

  getLowStock: async (): Promise<Product[]> => {
    const res = await api.get<Product[]>('/products/low-stock')
    return res.data
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await api.get<Category[]>('/categories')
    return res.data
  },

  createCategory: async (data: Omit<Category, 'id'>): Promise<Category> => {
    const res = await api.post<Category>('/categories', data)
    return res.data
  },

  adjustStock: async (productId: number, delta: number, reason: string): Promise<void> => {
    await api.post('/inventory/adjust', { productId, delta, reason })
  },
}
