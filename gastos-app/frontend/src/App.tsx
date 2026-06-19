// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'

import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import DashboardPage   from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import BudgetsPage     from './pages/BudgetsPage'
import GoalsPage       from './pages/GoalsPage'
import AlertsPage      from './pages/AlertsPage'
import Layout          from './components/layout/Layout'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
})

const Protected = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: '10px', background: '#1E293B', color: '#fff' },
            success: { iconTheme: { primary: '#0F6E56', secondary: '#fff' } }
          }}
        />
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={
            <Protected>
              <Layout />
            </Protected>
          }>
            <Route index          element={<DashboardPage />} />
            <Route path="gastos"  element={<TransactionsPage />} />
            <Route path="presupuestos" element={<BudgetsPage />} />
            <Route path="metas"   element={<GoalsPage />} />
            <Route path="alertas" element={<AlertsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
