// src/pages/AlertsPage.tsx
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, AlertTriangle, TrendingUp, Target, BarChart3 } from 'lucide-react'
import { alertApi } from '../services/api'
import { Alert } from '../types'

const ICONS: Record<string, typeof Bell> = {
  BUDGET_WARNING:  AlertTriangle,
  BUDGET_EXCEEDED: AlertTriangle,
  GOAL_REACHED:    Target,
  WEEKLY_SUMMARY:  BarChart3,
  UNUSUAL_EXPENSE: TrendingUp,
}

const COLORS: Record<string, string> = {
  BUDGET_WARNING:  '#854F0B',
  BUDGET_EXCEEDED: '#A32D2D',
  GOAL_REACHED:    '#0F6E56',
  WEEKLY_SUMMARY:  '#185FA5',
  UNUSUAL_EXPENSE: '#534AB7',
}

export default function AlertsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertApi.list().then(r => r.data.data)
  })

  const markAllRead = async () => {
    await alertApi.markAllRead()
    qc.invalidateQueries({ queryKey: ['alerts'] })
  }

  const markRead = async (id: string) => {
    await alertApi.markRead(id)
    qc.invalidateQueries({ queryKey: ['alerts'] })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-dark">Alertas</h1>
        <button onClick={markAllRead} className="text-sm text-brand-600 hover:underline">
          Marcar todas como leídas
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {isLoading ? (
          <p className="p-8 text-center text-slate-400 text-sm">Cargando...</p>
        ) : data?.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-slate-400 text-sm">No tienes alertas todavía</p>
          </div>
        ) : (
          (data || []).map((a: Alert) => {
            const Icon = ICONS[a.type] || Bell
            const color = COLORS[a.type] || '#888'
            return (
              <div
                key={a.id}
                onClick={() => !a.isRead && markRead(a.id)}
                className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors ${!a.isRead ? 'bg-brand-50/30' : ''}`}
              >
                <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${color}15` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!a.isRead ? 'font-semibold text-dark' : 'text-slate-600'}`}>
                    {a.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(a.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!a.isRead && <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
