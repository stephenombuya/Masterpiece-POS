import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { CartItem, Product } from '@/types'

const TAX_RATE = 0.16

interface CartContextValue {
  items: CartItem[]
  addItem: (product: Product, qty?: number) => void
  removeItem: (productId: number) => void
  updateQty: (productId: number, qty: number) => void
  clearCart: () => void
  subtotal: number
  taxAmount: number
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((product: Product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, product.stockQuantity)
        return prev.map(i => i.productId === product.id
          ? { ...i, quantity: newQty, lineTotal: i.unitPrice * newQty - i.discount }
          : i)
      }
      const lineTotal = product.price * qty
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice: product.price,
        discount: 0,
        lineTotal,
        maxStock: product.stockQuantity,
      }]
    })
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems(prev => prev.filter(i => i.productId !== productId))
  }, [])

  const updateQty = useCallback((productId: number, qty: number) => {
    if (qty <= 0) { removeItem(productId); return }
    setItems(prev => prev.map(i => i.productId === productId
      ? { ...i, quantity: qty, lineTotal: i.unitPrice * qty - i.discount }
      : i))
  }, [removeItem])

  const clearCart = useCallback(() => setItems([]), [])

  const subtotal  = items.reduce((s, i) => s + i.lineTotal, 0)
  const taxAmount = subtotal * TAX_RATE
  const total     = subtotal + taxAmount
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, subtotal, taxAmount, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
