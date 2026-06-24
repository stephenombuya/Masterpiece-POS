import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useProducts } from '@/hooks/useProducts'
import { productService } from '@/services/productService'
import { formatCurrency } from '@/utils'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Card, CardHeader, Badge, Modal, Table, Th, Td, PageSpinner, EmptyState } from '@/components/ui/index'
import { Search, Warehouse, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Product } from '@/types'

interface AdjustForm { delta: number; reason: string }

export default function InventoryPage() {
  const { products, loading, reload } = useProducts()
  const [search, setSearch]           = useState('')
  const [lowOnly, setLowOnly]         = useState(false)
  const [selected, setSelected]       = useState<Product | null>(null)
  const [direction, setDirection]     = useState<'add' | 'remove'>('add')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AdjustForm>()

  const filtered = useMemo(() => {
    let list = products.filter(p => p.active)
    if (lowOnly) list = list.filter(p => p.stockQuantity <= p.minStock)
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [products, search, lowOnly])

  const onAdjust = async (data: AdjustForm) => {
    if (!selected) return
    const delta = direction === 'add' ? Math.abs(data.delta) : -Math.abs(data.delta)
    if (direction === 'remove' && Math.abs(data.delta) > selected.stockQuantity) {
      toast.error(`Cannot remove more than current stock (${selected.stockQuantity})`)
      return
    }
    await productService.adjustStock(selected.id, delta, data.reason)
    toast.success(`Stock ${direction === 'add' ? 'added' : 'removed'} for ${selected.name}`)
    setSelected(null)
    reset()
    reload()
  }

  if (loading) return <PageSpinner/>

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Inventory" subtitle={`${products.filter(p => p.active).length} active products`}/>

        <div className="flex gap-3 mb-4">
          <Input
            leftIcon={<Search size={14}/>}
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1"
          />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={e => setLowOnly(e.target.checked)}
              className="rounded"
            />
            Low stock only
          </label>
          <Button variant="outline" size="sm" onClick={reload}>Refresh</Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Warehouse size={40}/>} title="No products found"/>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>In Stock</Th>
                <Th>Min Level</Th>
                <Th>Status</Th>
                <Th className="text-right">Adjust</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isLow = p.stockQuantity <= p.minStock
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <Td className="font-medium text-gray-900">{p.name}</Td>
                    <Td>{p.categoryName ?? '—'}</Td>
                    <Td>{formatCurrency(p.price)}</Td>
                    <Td>
                      <span className={`font-bold ${isLow ? 'text-danger-600' : 'text-gray-800'}`}>
                        {p.stockQuantity}
                      </span>
                    </Td>
                    <Td className="text-gray-500">{p.minStock}</Td>
                    <Td>
                      <Badge variant={isLow ? 'warning' : 'success'}>
                        {isLow ? '⚠ Low' : 'OK'}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <button
                        onClick={() => { setSelected(p); setDirection('add') }}
                        className="text-xs text-primary-600 hover:underline font-medium"
                      >
                        Adjust
                      </button>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Adjustment Modal */}
      <Modal
        open={!!selected}
        onClose={() => { setSelected(null); reset() }}
        title={`Adjust Stock — ${selected?.name}`}
        size="sm"
      >
        {selected && (
          <form onSubmit={handleSubmit(onAdjust)} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Current Stock</p>
              <p className="text-2xl font-bold text-gray-900">{selected.stockQuantity}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDirection('add')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                  direction === 'add'
                    ? 'border-success-600 bg-success-50 text-success-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <ArrowUp size={15}/> Add Stock
              </button>
              <button
                type="button"
                onClick={() => setDirection('remove')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                  direction === 'remove'
                    ? 'border-danger-600 bg-danger-50 text-danger-600'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <ArrowDown size={15}/> Remove
              </button>
            </div>

            <Input
              label="Quantity *"
              type="number"
              min={1}
              error={errors.delta?.message}
              {...register('delta', { required: 'Quantity is required', min: { value: 1, message: 'Must be at least 1' }, valueAsNumber: true })}
            />

            <Textarea
              label="Reason *"
              placeholder="e.g. Received from supplier, damaged goods..."
              error={errors.reason?.message}
              {...register('reason', { required: 'Reason is required' })}
            />

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => { setSelected(null); reset() }}>Cancel</Button>
              <Button
                type="submit"
                variant={direction === 'add' ? 'success' : 'danger'}
                loading={isSubmitting}
              >
                {direction === 'add' ? 'Add Stock' : 'Remove Stock'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
