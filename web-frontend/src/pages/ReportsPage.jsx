// src/pages/ReportsPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../services/api';
import { format, subDays, startOfMonth } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Calendar, TrendingUp, DollarSign, Package } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n ?? 0);
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const PRESETS = [
  { label: 'Today',        from: () => format(new Date(), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Last 7 days',  from: () => format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Last 30 days', from: () => format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'This month',   from: () => format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
];

export default function ReportsPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [to,   setTo]   = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: report, isLoading } = useQuery({
    queryKey: ['sales-report', from, to],
    queryFn: () => reportApi.sales(from, to).then(r => r.data),
    enabled: !!from && !!to,
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products', from, to],
    queryFn: () => reportApi.topProducts(8, from, to).then(r => r.data),
  });

  const { data: cashierPerf } = useQuery({
    queryKey: ['cashier-perf', from, to],
    queryFn: () => reportApi.cashierPerf(from, to).then(r => r.data),
  });

  const applyPreset = (preset) => {
    setFrom(preset.from());
    setTo(preset.to());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Reports</h1>
        <p className="text-slate-400 text-sm">Sales analytics and performance</p>
      </div>

      {/* Date controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
          <Calendar size={14} className="text-slate-400" />
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="bg-transparent text-white text-sm focus:outline-none" />
          <span className="text-slate-500">—</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="bg-transparent text-white text-sm focus:outline-none" />
        </div>

        <div className="flex gap-2">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300
                         px-3 py-2 rounded-lg transition">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Total Revenue',   value: fmt(report?.totalRevenue),        color: 'emerald' },
          { icon: TrendingUp, label: 'Transactions',    value: report?.transactionCount ?? '—',  color: 'blue'    },
          { icon: Package,    label: 'Items Sold',      value: report?.totalItemsSold ?? '—',    color: 'amber'   },
          { icon: DollarSign, label: 'Avg Transaction', value: fmt(report?.averageTransactionValue), color: 'purple' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs">{label}</p>
            <p className="text-white text-xl font-bold mt-1">{isLoading ? '…' : value}</p>
          </div>
        ))}
      </div>

      {/* Daily breakdown chart */}
      {report?.dailyBreakdown?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Daily Revenue Breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={report.dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={(v) => [fmt(v), 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Top Products by Units Sold</h2>
          {topProducts?.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white truncate">{p.productName}</span>
                      <span className="text-slate-400 ml-2 flex-shrink-0">{p.quantitySold} units</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(p.quantitySold / topProducts[0].quantitySold) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-emerald-400 text-xs font-medium flex-shrink-0">
                    {fmt(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No data for this period</p>
          )}
        </div>

        {/* Cashier performance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Cashier Performance</h2>
          {cashierPerf?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={cashierPerf} dataKey="revenue" nameKey="cashierName"
                    cx="50%" cy="50%" outerRadius={80} label={false}>
                    {cashierPerf.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    formatter={(v) => [fmt(v), 'Revenue']}
                  />
                  <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {cashierPerf.map((c, i) => (
                  <div key={c.cashierId} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-300">{c.cashierName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-medium">{fmt(c.revenue)}</span>
                      <span className="text-slate-500 text-xs ml-2">{c.transactionCount} txns</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm">No cashier data for this period</p>
          )}
        </div>
      </div>
    </div>
  );
}
