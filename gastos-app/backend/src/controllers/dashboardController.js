// src/controllers/dashboardController.js
const prisma = require('../config/prisma')

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id
    const now    = new Date()
    const month  = parseInt(req.query.month) || now.getMonth() + 1
    const year   = parseInt(req.query.year)  || now.getFullYear()

    const start = new Date(year, month - 1, 1)
    const end   = new Date(year, month, 0, 23, 59, 59)

    // Totales del mes
    const [expenseAgg, incomeAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', date: { gte: start, lte: end } },
        _sum: { amount: true }, _count: true
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', date: { gte: start, lte: end } },
        _sum: { amount: true }
      })
    ])

    const totalExpenses = expenseAgg._sum.amount || 0
    const totalIncome   = incomeAgg._sum.amount  || req.user.monthlyIncome
    const balance       = totalIncome - totalExpenses

    // Gastos por categoría
    const byCategory = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'EXPENSE', date: { gte: start, lte: end } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } }
    })

    const categoryIds = byCategory.map(b => b.categoryId).filter(Boolean)
    const categories  = await prisma.category.findMany({ where: { id: { in: categoryIds } } })
    const catMap      = Object.fromEntries(categories.map(c => [c.id, c]))

    const byCategoryFull = byCategory.map(b => ({
      category: catMap[b.categoryId] || { name: 'Sin categoría', color: '#888', icon: 'circle' },
      total: b._sum.amount,
      pct: totalExpenses > 0 ? (b._sum.amount / totalExpenses * 100).toFixed(1) : 0
    }))

    // Gastos por día (para gráfica de línea)
    const dailyRaw = await prisma.$queryRaw`
      SELECT DATE(date) as day, SUM(amount)::float as total
      FROM transactions
      WHERE "userId" = ${userId}
        AND type = 'EXPENSE'
        AND date >= ${start} AND date <= ${end}
      GROUP BY DATE(date)
      ORDER BY day ASC
    `

    // Presupuestos del mes
    const budgets = await prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } }
    })

    // Últimas 5 transacciones
    const recent = await prisma.transaction.findMany({
      where: { userId },
      include: { category: { select: { name: true, icon: true, color: true } } },
      orderBy: { date: 'desc' },
      take: 5
    })

    // Metas activas
    const goals = await prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 4
    })

    // Alertas no leídas
    const unreadAlerts = await prisma.alert.count({
      where: { userId, isRead: false }
    })

    res.json({
      month, year,
      summary: {
        totalExpenses,
        totalIncome,
        balance,
        transactionCount: expenseAgg._count,
        savingsRate: totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0
      },
      byCategoryFull,
      dailyExpenses: dailyRaw,
      budgets,
      recent,
      goals,
      unreadAlerts
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener dashboard' })
  }
}

exports.getMonthlyTrend = async (req, res) => {
  try {
    const userId = req.user.id
    const months = 6

    const results = []
    for (let i = months - 1; i >= 0; i--) {
      const d     = new Date()
      d.setMonth(d.getMonth() - i)
      const month = d.getMonth() + 1
      const year  = d.getFullYear()
      const start = new Date(year, month - 1, 1)
      const end   = new Date(year, month, 0, 23, 59, 59)

      const agg = await prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', date: { gte: start, lte: end } },
        _sum: { amount: true }
      })
      results.push({
        label: d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }),
        total: agg._sum.amount || 0,
        month, year
      })
    }
    res.json({ data: results })
  } catch {
    res.status(500).json({ error: 'Error al obtener tendencia' })
  }
}
