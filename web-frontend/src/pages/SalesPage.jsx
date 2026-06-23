// src/pages/SalesPage.jsx  (POS / Cashier Screen)
import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote,
  Smartphone, ShoppingBag, BarChart, X, Check
} from 'lucide-react';
import { productApi, saleApi } from '../services/api';
import { useCartStore } from '../store/authStore';

const fmt = (n = 0) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n);

// Payment method config
const PAYMENT_METHODS = [
  { id: 'CASH',  label: 'Cash',  icon: Banknote   },
  { id: 'CARD',  label: 'Card',  icon: CreditCard },
  { id: 'MPESA', label: 'M-Pesa',icon: Smartphone },
];

export default function SalesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountTendered, setAmountTendered] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const searchRef = useRef(null);

  const cart = useCartStore();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productApi.getAll({ search, activeOnly: true, size: 24 }).then(r => r.data.content),
    placeholderData: [],
    enabled: search.length === 0 || search.length >= 2,
  });

  const { mutate: completeSale, isPending } = useMutation({
    mutationFn: (payload) => saleApi.create(payload),
    onSuccess: (res) => {
      cart.clearCart();
      setShowCheckout(false);
      toast.success('Sale completed!');
      navigate(`/receipt/${res.data.receiptNumber}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message ?? 'Sale failed');
    },
  });

  const handleBarcode = async (e) => {
    if (e.key === 'Enter' && search.startsWith('BC:')) {
      const barcode = search.replace('BC:', '');
      try {
        const res = await productApi.getByBarcode(barcode);
        cart.addItem(res.data);
        setSearch('');
      } catch {
        toast.error('Product not found');
      }
    }
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) { toast.error('Cart is empty'); return; }
    setShowCheckout(true);
  };

  const handleCompleteSale = () => {
    const total = cart.getTotal();
    const tendered = parseFloat(amountTendered) || 0;

    if (paymentMethod === 'CASH' && tendered < total) {
      toast.error(`Amount tendered (${fmt(tendered)}) is less than total (${fmt(total)})`);
      return;
    }

    completeSale({
      items: cart.items.map(i => ({
        productId: i.productId,
        quantity:  i.quantity,
        discount:  i.discount || 0,
      })),
      paymentMethod,
      amountTendered: tendered || total,
      notes: null,
    });
  };

  const subtotal = cart.getSubtotal();
  const tax      = cart.getTaxTotal();
  const discount = cart.getDiscountTotal();
  const total    = cart.getTotal();
  const change   = Math.max(0, (parseFloat(amountTendered) || 0) - total);

  return (
    <div className="flex h-[calc(100vh-4rem-3rem)] gap-4">
      {/* === LEFT: Product Grid === */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleBarcode}
            placeholder="Search products or scan barcode (BC:123456)…"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white
                       text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-slate-500">Loading…</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {products?.map((product) => (
                <button key={product.id} onClick={() => cart.addItem(product)}
                  disabled={product.stockQuantity === 0}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-left
                             hover:border-emerald-500/50 hover:bg-slate-800 transition
                             disabled:opacity-40 disabled:cursor-not-allowed group">
                  <div className="w-full aspect-square bg-slate-800 rounded-lg mb-2 flex items-center
                                  justify-center text-2xl group-hover:bg-slate-700 transition">
                    <ShoppingBag size={24} className="text-slate-600" />
                  </div>
                  <p className="text-white text-xs font-medium line-clamp-2 mb-1">{product.name}</p>
                  <p className="text-emerald-400 font-bold text-sm">{fmt(product.sellingPrice)}</p>
                  <p className="text-slate-500 text-xs">Stock: {product.stockQuantity}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* === RIGHT: Cart === */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-slate-900 border border-slate-800 rounded-xl">
        {/* Cart header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <span className="font-semibold text-white">Cart</span>
          <span className="text-emerald-400 text-sm font-medium">{cart.itemCount()} items</span>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm">
              <ShoppingBag size={32} className="mb-2 text-slate-700" />
              Cart is empty
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.productId}
                className="bg-slate-800 rounded-lg p-3 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{item.name}</p>
                  <p className="text-emerald-400 text-xs">{fmt(item.unitPrice)} each</p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-1">
                  <button onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)}
                    className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center
                               hover:bg-slate-600 text-white">
                    <Minus size={12} />
                  </button>
                  <span className="text-white text-xs w-6 text-center">{item.quantity}</span>
                  <button onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxStock}
                    className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center
                               hover:bg-slate-600 text-white disabled:opacity-40">
                    <Plus size={12} />
                  </button>
                  <button onClick={() => cart.removeItem(item.productId)}
                    className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center
                               hover:bg-red-500/20 text-red-400 ml-1">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Subtotal</span><span>{fmt(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-amber-400">
              <span>Discount</span><span>-{fmt(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-slate-400">
            <span>Tax (VAT)</span><span>{fmt(tax)}</span>
          </div>
          <div className="flex justify-between text-white font-bold text-lg border-t border-slate-700 pt-2 mt-1">
            <span>Total</span><span>{fmt(total)}</span>
          </div>

          <div className="grid grid-cols-3 gap-1 mt-3">
            {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setPaymentMethod(id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition
                  ${paymentMethod === id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                <Icon size={16} />{label}
              </button>
            ))}
          </div>

          {paymentMethod === 'CASH' && (
            <div>
              <label className="text-xs text-slate-400">Amount Tendered</label>
              <input
                type="number"
                value={amountTendered}
                onChange={e => setAmountTendered(e.target.value)}
                placeholder={fmt(total)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white
                           text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {amountTendered && parseFloat(amountTendered) >= total && (
                <p className="text-emerald-400 text-xs mt-1">Change: {fmt(change)}</p>
              )}
            </div>
          )}

          <button onClick={handleCheckout} disabled={cart.items.length === 0}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed
                       text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2">
            <Check size={18} />
            Complete Sale
          </button>
        </div>
      </div>

      {/* Checkout confirm modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">Confirm Sale</h2>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between text-slate-300">
                <span>Items</span><span>{cart.itemCount()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Payment</span><span>{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-base border-t border-slate-700 pt-2">
                <span>Total</span><span>{fmt(total)}</span>
              </div>
              {paymentMethod === 'CASH' && amountTendered && (
                <>
                  <div className="flex justify-between text-slate-300">
                    <span>Tendered</span><span>{fmt(parseFloat(amountTendered))}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Change</span><span>{fmt(change)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowCheckout(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg transition">
                Cancel
              </button>
              <button onClick={handleCompleteSale} disabled={isPending}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white
                           font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                {isPending ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
