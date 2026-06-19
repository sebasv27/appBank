// src/components/forms/AddTransactionModal.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { categoryApi, transactionApi } from '../../services/api'
import { Category } from '../../types'

interface Props {
  onClose: () => void
  onSuccess: () => void
}

export default function AddTransactionModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    description: '', amount: '', categoryId: '',
    type: 'EXPENSE', date: new Date().toISOString().split('T')[0], notes: ''
  })
  const [loading, setLoading] = useState(false)

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then(r => r.data.data)
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.description || !form.amount) {
      toast.error('Descripción y monto son requeridos')
      return
    }
    setLoading(true)
    try {
      await transactionApi.create({
        ...form,
        amount: parseFloat(form.amount),
        categoryId: form.categoryId || undefined
      })
      toast.success('Gasto registrado ✓')
      onSuccess()
    } catch {
      toast.error('Error al guardar el gasto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-dark">Registrar gasto</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map(t => (
              <button
                key={t}
                onClick={() => set('type', t)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors
                  ${form.type === t
                    ? t === 'EXPENSE' ? 'bg-red-100 text-red-700'
                    : t === 'INCOME' ? 'bg-brand-100 text-brand-700'
                    : 'bg-slate-200 text-slate-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {t === 'EXPENSE' ? 'Gasto' : t === 'INCOME' ? 'Ingreso' : 'Transferencia'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Monto ($)</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              placeholder="0"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-2xl font-bold text-dark focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Descripción</label>
            <input
              type="text"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="ej. Mercado La 14"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Categoría</label>
            <select
              value={form.categoryId}
              onChange={e => set('categoryId', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Sin categoría</option>
              {(catData || []).map((c: Category) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Fecha</label>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Notas (opcional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="ej. compra semanal"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 rounded-lg py-2.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 bg-brand-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
