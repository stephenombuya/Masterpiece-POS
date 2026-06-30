import { useState, useRef, useCallback } from 'react'
import { useCart } from '@/context/CartContext'
import { productService } from '@/services/productService'
import { saleService } from '@/services/saleService'
import { useProducts } from '@/hooks/useProducts'
import { formatCurrency } from '@/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge, Modal, PageSpinner } from '@/components/ui/index'
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Product, PaymentMethod } from '@/types'

// ── Payment Method Button ─────────────────────────────────────────────
function PayBtn({ method, active, icon, onClick }: {
  method: string; active: boolean; icon: React.ReactNode; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
        active ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
      }`}
    >
      {icon}
      {method}
    </button>
  )
}

export default function SalePage() {
  const { products, loading } = useProducts()
  const { items, addItem, removeItem, updateQty, clearCart, subtotal, taxAmount, total, itemCount } = useCart()

  const [search, setSearch]         = useState('')
  const [payMethod, setPayMethod]   = useState<PaymentMethod>('CASH')
  const [tendered, setTendered]     = useState('')
  const [mpesaRef, setMpesaRef]     = useState('')
  const [completing, setCompleting] = useState(false)
  const [successSale, setSuccessSale] = useState<{ saleNumber: string; change: number } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = products.filter(p =>
    p.active && p.stockQuantity > 0 &&
    (search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode === search)
  )

  const handleBarcodeEnter = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !search.trim()) return
    try {
      const product = await productService.getByBarcode(search.trim())
      addItem(product)
      setSearch('')
    } catch {
      toast.error('Product not found for barcode: ' + search)
    }
  }, [search, addItem])

  const tenderedNum = parseFloat(tendered) || 0
  const change      = Math.max(0, tenderedNum - total)

  const handleCheckout = async () => {
    if (items.length === 0) { toast.error('Cart is empty'); return }
    if (tenderedNum < total)  { toast.error(`Insufficient payment. Total: ${formatCurrency(total)}`); return }
    if (payMethod === 'MPESA' && !mpesaRef.trim()) { toast.error('M-PESA reference is required'); return }

    setCompleting(true)
    try {
      const sale = await saleService.create({
        items,
        paymentMethod: payMethod,
        amountTendered: tenderedNum,
        paymentReference: mpesaRef || undefined,
      })
      setSuccessSale({ saleNumber: sale.saleNumber, change })
      clearCart()
      setTendered('')
      setMpesaRef('')
    } catch {
      // Error handled by interceptor
    } finally {
      setCompleting(false)
    }
  }

  if (loading) return <PageSpinner/>

  return (
    <div className="flex gap-5 h-full -m-6 p-6 overflow-hidden">

      {/* ── LEFT: Product Grid ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <Input
          ref={searchRef}
          leftIcon={<Search size={15}/>}
          placeholder="Search products or scan barcode and press Enter..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleBarcodeEnter}
          autoFocus
        />

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Search size={32} className="mb-2 opacity-30"/>
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} onAdd={() => addItem(p)}/>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart + Payment ─────────────────────────────────── */}
      <div className="w-80 flex flex-col gap-3 shrink-0">
        {/* Cart header */}
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Cart
              {itemCount > 0 && (
                <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">
                  {itemCount}
                </span>
              )}
            </h2>
            {items.length > 0 && (
              <button onClick={clearCart} className="text-xs text-danger-600 hover:underline flex items-center gap-1">
                <X size={12}/> Clear
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Add products to cart</p>
            ) : items.map(item => (
              <div key={item.productId} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="w-6 h-6 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  >
                    <Minus size={10}/>
                  </button>
                  <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="w-6 h-6 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    disabled={item.quantity >= item.maxStock}
                  >
                    <Plus size={10}/>
                  </button>
                </div>
                <div className="text-xs font-bold text-gray-700 w-16 text-right">
                  {formatCurrency(item.lineTotal)}
                </div>
                <button onClick={() => removeItem(item.productId)} className="text-gray-300 hover:text-danger-500">
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>

          {/* Totals */}
          {items.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>VAT (16%)</span><span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-100">
                <span>Total</span><span className="text-primary-700">{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="bg-white rounded-xl shadow-card p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payment</p>

          <div className="flex gap-2">
            <PayBtn method="CASH"  active={payMethod === 'CASH'}  icon={<Banknote size={14}/>}    onClick={() => setPayMethod('CASH')}/>
            <PayBtn method="MPESA" active={payMethod === 'MPESA'} icon={<Smartphone size={14}/>}  onClick={() => setPayMethod('MPESA')}/>
            <PayBtn method="CARD"  active={payMethod === 'CARD'}  icon={<CreditCard size={14}/>}  onClick={() => setPayMethod('CARD')}/>
          </div>

          {payMethod === 'MPESA' && (
            <Input
              placeholder="M-PESA transaction code"
              value={mpesaRef}
              onChange={e => setMpesaRef(e.target.value)}
            />
          )}

          <Input
            label="Amount Tendered (KES)"
            type="number"
            placeholder="0.00"
            value={tendered}
            onChange={e => setTendered(e.target.value)}
          />

          {tenderedNum >= total && total > 0 && (
            <div className="flex justify-between items-center bg-success-50 rounded-lg px-3 py-2">
              <span className="text-xs font-semibold text-success-600">Change</span>
              <span className="text-sm font-bold text-success-600">{formatCurrency(change)}</span>
            </div>
          )}

          <Button
            fullWidth
            size="lg"
            variant="success"
            loading={completing}
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="text-base"
          >
            ✓ Complete Sale
          </Button>
        </div>
      </div>

      {/* ── Success Modal ─────────────────────────────────────────── */}
      <Modal
        open={!!successSale}
        onClose={() => setSuccessSale(null)}
        title="Sale Complete"
        size="sm"
      >
        {successSale && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-success-50 flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <div>
              <p className="font-semibold text-gray-900">{successSale.saleNumber}</p>
              <p className="text-sm text-gray-500 mt-1">Transaction recorded successfully</p>
            </div>
            {successSale.change > 0 && (
              <div className="bg-success-50 rounded-xl p-4">
                <p className="text-xs text-success-600 font-semibold">Change Due</p>
                <p className="text-2xl font-bold text-success-600">{formatCurrency(successSale.change)}</p>
              </div>
            )}
            <Button fullWidth onClick={() => setSuccessSale(null)}>New Sale</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── Product Card ──────────────────────────────────────────────────────
function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="group bg-white rounded-xl shadow-card p-3 text-left hover:shadow-card-hover hover:border-primary-200 border border-transparent transition-all duration-150 active:scale-95"
    >
      <div className="w-full h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-2 text-primary-600 font-bold text-lg group-hover:bg-primary-100 transition-colors">
        {product.name[0]}
      </div>
      <p className="text-xs font-semibold text-gray-800 truncate">{product.name}</p>
      <p className="text-xs text-primary-700 font-bold mt-0.5">{formatCurrency(product.price)}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-400">Stock: {product.stockQuantity}</span>
        {product.isLowStock && <Badge variant="warning">Low</Badge>}
      </div>
    </button>
  )
}
