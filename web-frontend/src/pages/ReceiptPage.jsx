// src/pages/ReceiptPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { saleApi } from '../services/api';
import { format } from 'date-fns';
import { Printer, ArrowLeft, ShoppingCart } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n ?? 0);

export default function ReceiptPage() {
  const { receiptNumber } = useParams();
  const navigate = useNavigate();

  const { data: sale, isLoading } = useQuery({
    queryKey: ['receipt', receiptNumber],
    queryFn: () => saleApi.getReceipt(receiptNumber).then(r => r.data),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-slate-400">Loading receipt…</div>
  );
  if (!sale) return (
    <div className="text-center text-slate-400 py-10">Receipt not found</div>
  );

  return (
    <div className="max-w-md mx-auto">
      {/* Actions (hidden on print) */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <button onClick={() => navigate('/sales')}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition">
          <ArrowLeft size={16} />Back to POS
        </button>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white
                     text-sm px-4 py-2 rounded-lg transition">
          <Printer size={16} />Print Receipt
        </button>
      </div>

      {/* Receipt */}
      <div className="bg-white text-gray-900 rounded-xl p-6 font-mono text-sm shadow-2xl">
        {/* Store header */}
        <div className="text-center mb-4 border-b border-dashed border-gray-300 pb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ShoppingCart size={20} className="text-emerald-600" />
            <span className="font-bold text-lg">RetailPOS</span>
          </div>
          <p className="text-gray-500 text-xs">Nairobi, Kenya</p>
          <p className="text-gray-500 text-xs">Tel: +254 700 000 000</p>
        </div>

        {/* Receipt meta */}
        <div className="space-y-1 mb-4 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Receipt #</span>
            <span className="font-bold">{sale.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span>{format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Cashier</span>
            <span>{sale.cashierName}</span>
          </div>
          {sale.customerName && (
            <div className="flex justify-between">
              <span className="text-gray-500">Customer</span>
              <span>{sale.customerName}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-300 mb-3" />

        {/* Items */}
        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-12 text-xs text-gray-400 font-semibold mb-1">
            <span className="col-span-6">Item</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Price</span>
            <span className="col-span-2 text-right">Total</span>
          </div>
          {sale.items?.map((item, i) => (
            <div key={i} className="grid grid-cols-12 text-xs">
              <span className="col-span-6 truncate">{item.productName}</span>
              <span className="col-span-2 text-center">{item.quantity}</span>
              <span className="col-span-2 text-right">{fmt(item.unitPrice)}</span>
              <span className="col-span-2 text-right font-semibold">{fmt(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-300 mb-3" />

        {/* Totals */}
        <div className="space-y-1 text-xs mb-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{fmt(sale.subtotal)}</span>
          </div>
          {sale.discountTotal > 0 && (
            <div className="flex justify-between text-amber-600">
              <span>Discount</span>
              <span>-{fmt(sale.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">VAT</span>
            <span>{fmt(sale.taxTotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-1 mt-1">
            <span>TOTAL</span>
            <span>{fmt(sale.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Payment ({sale.paymentMethod})</span>
            <span>{fmt(sale.amountTendered)}</span>
          </div>
          {sale.changeGiven > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Change</span>
              <span>{fmt(sale.changeGiven)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center border-t border-dashed border-gray-300 pt-4 text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-700">Thank you for your purchase!</p>
          <p>Goods once sold are not returnable</p>
          <p>without a receipt within 7 days.</p>
        </div>
      </div>
    </div>
  );
}
