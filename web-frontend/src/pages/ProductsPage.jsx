// src/pages/ProductsPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Package, AlertTriangle } from 'lucide-react';
import { productApi, categoryApi } from '../services/api';
import ProductModal from '../components/products/ProductModal';
import StockAdjustModal from '../components/products/StockAdjustModal';

const fmt = (n) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n ?? 0);

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [editProduct, setEditProduct] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, page],
    queryFn: () => productApi.getAll({ search, page, size: 15, activeOnly: false }).then(r => r.data),
    placeholderData: { content: [], totalPages: 0, totalElements: 0 },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getAll().then(r => r.data),
  });

  const { mutate: deactivate } = useMutation({
    mutationFn: (id) => productApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deactivated');
    },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Products</h1>
          <p className="text-slate-400 text-sm">{data?.totalElements ?? 0} total products</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white
                     font-semibold px-4 py-2 rounded-lg transition text-sm">
          <Plus size={16} />Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search by name, SKU, barcode…"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white
                     text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-left">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-right">Cost</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
              ) : data?.content?.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No products found</td></tr>
              ) : (
                data.content.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                          <Package size={14} className="text-slate-500" />
                        </div>
                        <span className="text-white font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 text-slate-400">{p.categoryName ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{fmt(p.costPrice)}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-semibold">{fmt(p.sellingPrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${p.lowStock ? 'text-red-400' : 'text-white'}`}>
                        {p.stockQuantity}
                        {p.lowStock && <AlertTriangle size={12} className="inline ml-1" />}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                        ${p.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setStockProduct(p)}
                          className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20
                                     px-2 py-1 rounded transition">
                          Stock
                        </button>
                        <button onClick={() => setEditProduct(p)}
                          className="text-xs bg-slate-700 text-slate-300 hover:bg-slate-600
                                     px-2 py-1 rounded transition">
                          <Edit2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <span className="text-slate-500 text-xs">Page {page + 1} of {data.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                className="text-xs bg-slate-800 text-slate-300 disabled:opacity-40 px-3 py-1 rounded">
                Prev
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages - 1}
                className="text-xs bg-slate-800 text-slate-300 disabled:opacity-40 px-3 py-1 rounded">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(showCreate || editProduct) && (
        <ProductModal
          product={editProduct}
          categories={categories ?? []}
          onClose={() => { setShowCreate(false); setEditProduct(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['products'] });
            setShowCreate(false); setEditProduct(null);
          }}
        />
      )}
      {stockProduct && (
        <StockAdjustModal
          product={stockProduct}
          onClose={() => setStockProduct(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['products'] });
            setStockProduct(null);
          }}
        />
      )}
    </div>
  );
}
