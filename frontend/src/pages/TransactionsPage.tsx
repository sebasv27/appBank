// src/pages/TransactionsPage.tsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, Download, Search, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { transactionApi, categoryApi } from '../services/api'
import { fmtCOP, fmtDate } from '../utils/format'
import { Category, Transaction } from '../types'
import AddTransactionModal from '../components/forms/AddTransactionModal'

export default function TransactionsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, search, categoryId],
    queryFn: () => transactionApi.list({
      page, limit: 20,
      ...(search && { search }),
      ...(categoryId && { categoryId })
    }).then(r => r.data)
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then(r => r.data.data)
  })

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    try {
      await transactionApi.remove(id)
      toast.success('Eliminado')
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleExport = async () => {
    try {
      const res = await transactionApi.exportCSV()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'gastos.csv'
      a.click()
    } catch {
      toast.error('Error al exportar')
    }
  }

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['transactions'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-dark">Gastos</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Download size={14} /> Exportar
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-brand-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-700"
          >
            <Plus size={14} /> Nuevo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar gasto..."
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={categoryId}
          onChange={e => { setCategoryId(e.target.value); setPage(1) }}
          className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Todas las categorías</option>
          {(categories || []).map((c: Category) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>
        ) : data?.data?.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No hay gastos registrados</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {(data?.data || []).map((t: Transaction) => (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: t.category?.color || '#888' }}
                  >
                    {t.category?.name?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dark truncate">{t.description}</p>
                    <p className="text-xs text-slate-400">
                      {t.category?.name || 'Sin categoría'} · {fmtDate(t.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-sm font-semibold ${t.type === 'EXPENSE' ? 'text-red-600' : 'text-brand-600'}`}>
                    {t.type === 'EXPENSE' ? '-' : '+'}{fmtCOP(t.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.pagination?.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm ${
                p === page ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {showAdd && (
        <AddTransactionModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); refresh() }}
        />
      )}
    </div>
  )
}
