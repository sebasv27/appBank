// src/types/index.ts

export interface User {
  id: string
  name: string
  email: string
  monthlyIncome: number
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export interface Transaction {
  id: string
  amount: number
  description: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  source: 'MANUAL' | 'NOTIFICATION' | 'RECEIPT_OCR' | 'IMPORT'
  date: string
  notes?: string
  categoryId?: string
  category?: Category
}

export interface Budget {
  id: string
  amount: number
  spent: number
  month: number
  year: number
  alertAt: number
  categoryId: string
  category: Category
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  deadline?: string
  icon: string
  color: string
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED'
}

export interface Alert {
  id: string
  type: 'BUDGET_WARNING' | 'BUDGET_EXCEEDED' | 'GOAL_REACHED' | 'WEEKLY_SUMMARY' | 'UNUSUAL_EXPENSE'
  message: string
  isRead: boolean
  createdAt: string
  metadata?: Record<string, unknown>
}

export interface DashboardSummary {
  totalExpenses: number
  totalIncome: number
  balance: number
  transactionCount: number
  savingsRate: string
}

export interface DashboardData {
  month: number
  year: number
  summary: DashboardSummary
  byCategoryFull: { category: Category; total: number; pct: string }[]
  dailyExpenses:  { day: string; total: number }[]
  budgets: Budget[]
  recent: Transaction[]
  goals: Goal[]
  unreadAlerts: number
}
