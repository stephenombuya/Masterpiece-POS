// ── Auth ─────────────────────────────────────────────────────────────
export interface User {
  id: number
  username: string
  fullName: string
  email: string
  roleId: number
  roleName: string
  active: boolean
  createdAt: string
}

export interface LoginRequest  { username: string; password: string }
export interface LoginResponse { token: string; user: User }

// ── Products ──────────────────────────────────────────────────────────
export interface Category {
  id: number
  name: string
  description?: string
}

export interface Product {
  id: number
  name: string
  barcode?: string
  description?: string
  price: number
  costPrice: number
  categoryId: number
  categoryName?: string
  active: boolean
  stockQuantity: number
  minStock: number
  createdAt?: string
  updatedAt?: string
  isLowStock?: boolean
}

export type ProductFormData = Omit<Product, 'id' | 'categoryName' | 'createdAt' | 'updatedAt'>

// ── Inventory ─────────────────────────────────────────────────────────
export interface InventoryAdjustment {
  productId: number
  delta: number
  reason: string
}

// ── Sales ─────────────────────────────────────────────────────────────
export type PaymentMethod = 'CASH' | 'MPESA' | 'CARD' | 'CREDIT'
export type SaleStatus    = 'COMPLETED' | 'VOIDED' | 'REFUNDED'

export interface SaleItem {
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  discount: number
  lineTotal: number
}

export interface CartItem extends SaleItem {
  maxStock: number
}

export interface SaleRequest {
  items: SaleItem[]
  paymentMethod: PaymentMethod
  amountTendered: number
  paymentReference?: string
}

export interface Sale {
  id: number
  saleNumber: string
  cashierId: number
  cashierName: string
  items: SaleItem[]
  subtotal: number
  taxAmount: number
  discount: number
  totalAmount: number
  status: SaleStatus
  notes?: string
  createdAt: string
}

// ── Reports ───────────────────────────────────────────────────────────
export interface TopProduct {
  productName: string
  quantitySold: number
  revenue: number
}

export interface DailySummary {
  date: string
  transactions: number
  revenue: number
}

export interface ReportData {
  fromDate: string
  toDate: string
  totalTransactions: number
  totalRevenue: number
  totalTax: number
  totalDiscount: number
  netRevenue: number
  topProducts: TopProduct[]
  dailySummaries: DailySummary[]
}

// ── API ───────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string>
}
