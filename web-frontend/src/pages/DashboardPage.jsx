// src/pages/DashboardPage.jsx
import { useQuery } from '@tanstack/react-query';
import { reportApi, productApi } from '../services/api';
import { format } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { TrendingUp, ShoppingCart, Package, AlertTriangle, DollarSign, Users } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color = 'emerald' }) {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue:    'bg-blue-500/10    text-blue-400',
    amber:   'bg-amber-500/10   text-amber-400',
    red:     'bg-red-500/10     text-red-400',
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

const fmt = (n) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n ?? 0);

export default function DashboardPage() {
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: daily } = useQuery({
    queryKey: ['daily-summary', today],
    queryFn: () => reportApi.daily(today).then(r => r.data),
  });

  const { data: weekReport } = useQuery({
    queryKey: ['week-report'],
    queryFn: () => {
      const from = format(new Date(Date.now() - 6 * 864e5), 'yyyy-MM-dd');
      return reportApi.sales(from, today).then(r => r.data);
    },
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => productApi.getLowStock().then(r => r.data),
  });

  const { data: topProducts } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => reportApi.topProducts(5, null, null).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Today's Revenue" value={fmt(daily?.totalRevenue)}
          sub={`${daily?.transactionCount ?? 0} transactions`} color="emerald" />
        <StatCard icon={ShoppingCart} label="Items Sold Today" value={daily?.itemsSold ?? 0}
          sub="units across all products" color="blue" />
        <StatCard icon={TrendingUp} label="Weekly Revenue" value={fmt(weekReport?.totalRevenue)}
          sub="last 7 days" color="blue" />
        <StatCard icon={AlertTriangle} label="Low Stock Alerts" value={lowStock?.length ?? 0}
          sub="products below threshold" color={lowStock?.length > 0 ? 'red' : 'emerald'} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly revenue area chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Weekly Revenue</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weekReport?.dailyBreakdown ?? []}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v) => [fmt(v), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top products bar chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Top Products</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <YAxis type="category" dataKey="productName" tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false} width={80} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={(v) => [v, 'Units Sold']}
              />
              <Bar dataKey="quantitySold" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low stock table */}
      {lowStock?.length > 0 && (
        <div className="bg-slate-900 border border-red-900/40 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            Low Stock Alerts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-left border-b border-slate-800">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">SKU</th>
                  <th className="pb-2 font-medium text-right">In Stock</th>
                  <th className="pb-2 font-medium text-right">Min Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {lowStock.map((p) => (
                  <tr key={p.id} className="text-slate-300">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-slate-500">{p.sku}</td>
                    <td className="py-2 text-right text-red-400 font-semibold">{p.stockQuantity}</td>
                    <td className="py-2 text-right text-slate-500">{p.lowStockAlert}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
