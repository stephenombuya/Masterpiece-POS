import { useEffect, useState } from 'react'
import { useReport } from '@/hooks/useReport'
import { formatCurrency, todayISO, weekStartISO, monthStartISO } from '@/utils'
import { Button } from '@/components/ui/Button'
import { StatCard, Card, CardHeader, Table, Th, Td, PageSpinner, EmptyState } from '@/components/ui/index'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { TrendingUp, ShoppingBag, Receipt, Percent } from 'lucide-react'

type Range = 'today' | 'week' | 'month' | 'custom'

export default function ReportsPage() {
  const { report, loading, load } = useReport()
  const [range, setRange]         = useState<Range>('today')
  const [from, setFrom]           = useState(todayISO())
  const [to, setTo]               = useState(todayISO())

  useEffect(() => {
    if (range === 'today')  { const t = todayISO();       load(t, t) }
    if (range === 'week')   { load(weekStartISO(), todayISO()) }
    if (range === 'month')  { load(monthStartISO(), todayISO()) }
  }, [range, load])

  const handleCustom = () => { if (from && to) load(from, to) }

  const rangeBtn = (r: Range, label: string) => (
    <button
      onClick={() => setRange(r)}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        range === r ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-5">
      {/* Filter row */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">Period:</span>
          {rangeBtn('today', 'Today')}
          {rangeBtn('week', 'This Week')}
          {rangeBtn('month', 'This Month')}
          {rangeBtn('custom', 'Custom')}
          {range === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"/>
              <span className="text-gray-400 text-sm">to</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"/>
              <Button size="sm" onClick={handleCustom}>Load</Button>
            </div>
          )}
        </div>
      </Card>

      {loading ? <PageSpinner/> : !report ? (
        <EmptyState title="Select a period to load report"/>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Transactions"
              value={String(report.totalTransactions)}
              icon={<Receipt size={18}/>}
            />
            <StatCard
              label="Gross Revenue"
              value={formatCurrency(report.totalRevenue)}
              icon={<ShoppingBag size={18}/>}
            />
            <StatCard
              label="VAT Collected"
              value={formatCurrency(report.totalTax)}
              icon={<Percent size={18}/>}
            />
            <StatCard
              label="Net Revenue"
              value={formatCurrency(report.netRevenue)}
              icon={<TrendingUp size={18}/>}
              accent
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Daily revenue chart */}
            {report.dailySummaries.length > 1 && (
              <Card>
                <CardHeader title="Daily Revenue" subtitle="Revenue trend over period"/>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={report.dailySummaries} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)}/>
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
                    <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} labelFormatter={l => `Date: ${l}`}/>
                    <Line type="monotone" dataKey="revenue" stroke="#1565c0" strokeWidth={2} dot={{ r: 3 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Top products chart */}
            {report.topProducts.length > 0 && (
              <Card>
                <CardHeader title="Top Products" subtitle="By quantity sold"/>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={report.topProducts.slice(0, 8)} margin={{ top: 5, right: 5, bottom: 30, left: 0 }}>
                    <XAxis dataKey="productName" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0}/>
                    <YAxis tick={{ fontSize: 11 }}/>
                    <Tooltip formatter={(v: number) => [v, 'Qty Sold']}/>
                    <Bar dataKey="quantitySold" fill="#1565c0" radius={[4, 4, 0, 0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          {/* Top products table */}
          <Card>
            <CardHeader title="Product Performance"/>
            <Table>
              <thead>
                <tr>
                  <Th>#</Th>
                  <Th>Product</Th>
                  <Th>Qty Sold</Th>
                  <Th>Revenue</Th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((p, i) => (
                  <tr key={p.productName} className="hover:bg-gray-50">
                    <Td className="text-gray-400 font-mono text-xs">{i + 1}</Td>
                    <Td className="font-medium text-gray-900">{p.productName}</Td>
                    <Td>{p.quantitySold}</Td>
                    <Td className="font-semibold text-primary-700">{formatCurrency(p.revenue)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          {/* Daily breakdown table */}
          {report.dailySummaries.length > 0 && (
            <Card>
              <CardHeader title="Daily Breakdown"/>
              <Table>
                <thead>
                  <tr><Th>Date</Th><Th>Transactions</Th><Th>Revenue</Th></tr>
                </thead>
                <tbody>
                  {report.dailySummaries.map(d => (
                    <tr key={d.date} className="hover:bg-gray-50">
                      <Td className="font-mono text-sm">{d.date}</Td>
                      <Td>{d.transactions}</Td>
                      <Td className="font-semibold">{formatCurrency(d.revenue)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
