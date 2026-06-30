import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useProducts } from '@/hooks/useProducts'
import { formatCurrency } from '@/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Card, CardHeader, Badge, Modal, Table, Th, Td, PageSpinner, EmptyState, ConfirmDialog } from '@/components/ui/index'
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react'
import type { Product, ProductFormData } from '@/types'

export default function ProductsPage() {
  const { products, categories, loading, createProduct, updateProduct, deleteProduct } = useProducts()
  const [search, setSearch]       = useState('')
  const [editing, setEditing]     = useState<Product | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting]   = useState<Product | null>(null)
  const [delLoading, setDelLoading] = useState(false)

  const filtered = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode ?? '').includes(search)
    ), [products, search])

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit   = (p: Product) => { setEditing(p); setModalOpen(true) }

  const handleDelete = async () => {
    if (!deleting) return
    setDelLoading(true)
    try { await deleteProduct(deleting.id); setDeleting(null) }
    finally { setDelLoading(false) }
  }

  if (loading) return <PageSpinner/>

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Products"
          subtitle={`${products.length} total`}
          action={
            <Button onClick={openCreate} size="sm">
              <Plus size={14}/> New Product
            </Button>
          }
        />
        <div className="mb-4">
          <Input
            leftIcon={<Search size={14}/>}
            placeholder="Search by name or barcode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Package size={40}/>} title="No products found"/>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Barcode</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Cost</Th>
                <Th>Stock</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <Td className="font-medium text-gray-900">{p.name}</Td>
                  <Td className="font-mono text-xs">{p.barcode ?? '—'}</Td>
                  <Td>{p.categoryName ?? '—'}</Td>
                  <Td className="font-semibold">{formatCurrency(p.price)}</Td>
                  <Td className="text-gray-500">{formatCurrency(p.costPrice)}</Td>
                  <Td>
                    <span className={p.stockQuantity <= p.minStock ? 'text-danger-600 font-bold' : ''}>
                      {p.stockQuantity}
                    </span>
                    {p.stockQuantity <= p.minStock && (
                      <Badge variant="warning" >Low</Badge>
                    )}
                  </Td>
                  <Td>
                    <Badge variant={p.active ? 'success' : 'neutral'}>
                      {p.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="text-primary-600 hover:text-primary-800">
                        <Edit2 size={14}/>
                      </button>
                      <button onClick={() => setDeleting(p)} className="text-danger-500 hover:text-danger-700">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editing}
        categories={categories}
        onCreate={createProduct}
        onUpdate={updateProduct}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Deactivate Product"
        message={`Are you sure you want to deactivate "${deleting?.name}"?`}
        confirmLabel="Deactivate"
        danger
        loading={delLoading}
      />
    </div>
  )
}

// ── Product Form Modal ────────────────────────────────────────────────
function ProductModal({
  open, onClose, product, categories, onCreate, onUpdate
}: {
  open: boolean; onClose: () => void; product: Product | null
  categories: { id: number; name: string }[]
  onCreate: (d: ProductFormData) => Promise<unknown>
  onUpdate: (id: number, d: ProductFormData) => Promise<unknown>
}) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    defaultValues: product ?? { active: true, stockQuantity: 0, minStock: 5, costPrice: 0 },
  })

  const onSubmit = async (data: ProductFormData) => {
    if (product) await onUpdate(product.id, data)
    else await onCreate(data)
    onClose(); reset()
  }

  return (
    <Modal open={open} onClose={onClose} title={product ? 'Edit Product' : 'New Product'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Name *" error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}/>
          <Input label="Barcode" placeholder="Optional"
            {...register('barcode')}/>
        </div>
        <Textarea label="Description" {...register('description')}/>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Selling Price (KES) *" type="number" step="0.01"
            error={errors.price?.message}
            {...register('price', { required: true, min: 0, valueAsNumber: true })}/>
          <Input label="Cost Price (KES)" type="number" step="0.01"
            {...register('costPrice', { valueAsNumber: true })}/>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Category"
            options={categories.map(c => ({ value: c.id, label: c.name }))}
            placeholder="Select category"
            {...register('categoryId', { valueAsNumber: true })}
          />
          <Input label="Stock Qty" type="number"
            {...register('stockQuantity', { valueAsNumber: true })}/>
          <Input label="Min Stock" type="number"
            {...register('minStock', { valueAsNumber: true })}/>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" {...register('active')} className="rounded"/>
          Active
        </label>
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>
            {product ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
