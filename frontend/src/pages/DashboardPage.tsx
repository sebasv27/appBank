// src/pages/DashboardPage.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingDown, TrendingUp, Wallet, PiggyBank, ArrowRight } from 'lucide-react'
import { dashboardApi } from '../services/api'
import { fmtCOP, fmtShortDate } from '../utils/format'
import { useAuthStore } from '../store/authStore'
import AddTransactionModal from '../components/forms/AddTransactionModal'
import BudgetProgressBar   from '../components/ui/BudgetProgressBar'
import GoalCard            from '../components/ui/GoalCard'

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)
  const now  = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year,  setYear]  = useState(now.getFullYear())
  const [showAdd, setShowAdd] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', month, year],
    queryFn: () => dashboardApi.getSummary(month, year).then(r => r.data)
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const d = data
  const dailyData = (d?.dailyExpenses || []).map((e: { day: string; total: number }) => ({
    day: fmtShortDate(e.day),
    total: e.total
  }))

  const COLORS = (d?.byCategoryFull || []).map((c: { category: { color: string } }) => c.category.color)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-dark">
            Hola, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date(year, month - 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={e => setMonth(+e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={i+1}>
                {new Date(2024, i).toLocaleDateString('es-CO', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(+e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            + Gasto
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gastos del mes', value: d?.summary.totalExpenses, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Ingresos',       value: d?.summary.totalIncome,   icon: TrendingUp,  color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Balance',        value: d?.summary.balance,       icon: Wallet,      color: d?.summary.balance >= 0 ? 'text-brand-600' : 'text-red-600', bg: 'bg-slate-100' },
          { label: 'Tasa de ahorro', value: null, icon: PiggyBank, color: 'text-blue-600', bg: 'bg-blue-50', extra: `${d?.summary.savingsRate}%` },
        ].map(({ label, value, icon: Icon, color, bg, extra }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500">{label}</span>
              <div className={`${bg} p-1.5 rounded-lg`}>
                <Icon size={14} className={color} />
              </div>
            </div>
            <p className={`text-lg font-bold ${color}`}>
              {extra || fmtCOP(value || 0)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-dark mb-4">Gastos diarios</h2>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0F6E56" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0F6E56" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(v: number) => fmtCOP(v)} />
                <Area type="monotone" dataKey="total" stroke="#0F6E56" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              Sin gastos este mes
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-dark mb-4">Por categoría</h2>
          {d?.byCategoryFull?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={d.byCategoryFull}
                  dataKey="total"
                  nameKey="category.name"
                  cx="50%" cy="50%"
                  outerRadius={70}
                  innerRadius={40}
                >
                  {d.byCategoryFull.map((_: unknown, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmtCOP(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Sin datos</div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Budgets */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-dark">Presupuestos</h2>
            <a href="/presupuestos" className="text-xs text-brand-600 flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight size={12} />
            </a>
          </div>
          <div className="space-y-3">
            {(d?.budgets || []).slice(0, 5).map((b: import('../types').Budget) => (
              <BudgetProgressBar key={b.id} budget={b} />
            ))}
            {(!d?.budgets || d.budgets.length === 0) && (
              <p className="text-slate-400 text-sm text-center py-4">Sin presupuestos configurados</p>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-dark">Últimos gastos</h2>
            <a href="/gastos" className="text-xs text-brand-600 flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight size={12} />
            </a>
          </div>
          <div className="space-y-2">
            {(d?.recent || []).map((t: import('../types').Transaction) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: t.category?.color || '#888' }}
                  >
                    {t.category?.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark leading-none">{t.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.category?.name}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${t.type === 'EXPENSE' ? 'text-red-600' : 'text-brand-600'}`}>
                  {t.type === 'EXPENSE' ? '-' : '+'}{fmtCOP(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goals */}
      {d?.goals?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-dark">Metas activas</h2>
            <a href="/metas" className="text-xs text-brand-600 flex items-center gap-1 hover:underline">
              Ver todas <ArrowRight size={12} />
            </a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {d.goals.map((g: import('../types').Goal) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <AddTransactionModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); refetch() }}
        />
      )}
    </div>
  )
}
