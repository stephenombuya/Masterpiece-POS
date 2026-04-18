// src/components/products/ProductModal.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Loader } from 'lucide-react';
import { productApi } from '../../services/api';

const schema = z.object({
  sku:          z.string().min(1, 'SKU is required'),
  name:         z.string().min(2, 'Name must be at least 2 characters'),
  description:  z.string().optional(),
  categoryId:   z.coerce.number().optional().nullable(),
  costPrice:    z.coerce.number().min(0, 'Cost price must be ≥ 0'),
  sellingPrice: z.coerce.number().min(0.01, 'Selling price must be > 0'),
  taxRate:      z.coerce.number().min(0).max(100),
  initialStock: z.coerce.number().min(0).optional(),
  lowStockAlert:z.coerce.number().min(0).optional(),
  barcode:      z.string().optional(),
});

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputCls = `w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500`;

export default function ProductModal({ product, categories, onClose, onSaved }) {
  const isEdit = !!product;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEdit ? {
      sku:           product.sku,
      name:          product.name,
      description:   product.description ?? '',
      categoryId:    product.categoryId ?? null,
      costPrice:     product.costPrice,
      sellingPrice:  product.sellingPrice,
      taxRate:       product.taxRate ?? 0,
      lowStockAlert: product.lowStockAlert ?? 10,
      barcode:       product.barcode ?? '',
    } : {
      taxRate: 16,
      lowStockAlert: 10,
      initialStock: 0,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) =>
      isEdit ? productApi.update(product.id, data) : productApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
      onSaved();
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Failed to save product'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-white font-bold text-lg">
            {isEdit ? 'Edit Product' : 'New Product'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(mutate)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU *" error={errors.sku?.message}>
              <input {...register('sku')} placeholder="PROD-001" className={inputCls}
                disabled={isEdit} />
            </Field>
            <Field label="Barcode" error={errors.barcode?.message}>
              <input {...register('barcode')} placeholder="1234567890" className={inputCls} />
            </Field>
          </div>

          <Field label="Product Name *" error={errors.name?.message}>
            <input {...register('name')} placeholder="e.g. Coca Cola 500ml" className={inputCls} />
          </Field>

          <Field label="Description" error={errors.description?.message}>
            <textarea {...register('description')} rows={2} placeholder="Optional description"
              className={`${inputCls} resize-none`} />
          </Field>

          <Field label="Category" error={errors.categoryId?.message}>
            <select {...register('categoryId')} className={inputCls}>
              <option value="">— None —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Cost Price (KES) *" error={errors.costPrice?.message}>
              <input {...register('costPrice')} type="number" step="0.01" placeholder="0.00"
                className={inputCls} />
            </Field>
            <Field label="Selling Price (KES) *" error={errors.sellingPrice?.message}>
              <input {...register('sellingPrice')} type="number" step="0.01" placeholder="0.00"
                className={inputCls} />
            </Field>
            <Field label="Tax Rate (%)" error={errors.taxRate?.message}>
              <input {...register('taxRate')} type="number" step="0.01" placeholder="16"
                className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!isEdit && (
              <Field label="Initial Stock" error={errors.initialStock?.message}>
                <input {...register('initialStock')} type="number" placeholder="0"
                  className={inputCls} />
              </Field>
            )}
            <Field label="Low Stock Alert" error={errors.lowStockAlert?.message}>
              <input {...register('lowStockAlert')} type="number" placeholder="10"
                className={inputCls} />
            </Field>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg transition text-sm">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white
                         font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 text-sm">
              {isPending && <Loader size={14} className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
