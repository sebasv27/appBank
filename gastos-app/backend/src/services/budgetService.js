// src/services/budgetService.js
const prisma = require('../config/prisma')

/**
 * Recalcula el monto gastado en un presupuesto dado el mes/año
 */
exports.updateSpent = async (userId, categoryId, date) => {
  const month = date.getMonth() + 1
  const year  = date.getFullYear()
  const start = new Date(year, month - 1, 1)
  const end   = new Date(year, month, 0, 23, 59, 59)

  const agg = await prisma.transaction.aggregate({
    where: { userId, categoryId, type: 'EXPENSE', date: { gte: start, lte: end } },
    _sum: { amount: true }
  })

  const spent = agg._sum.amount || 0

  await prisma.budget.updateMany({
    where: { userId, categoryId, month, year },
    data:  { spent }
  })

  return spent
}

/**
 * Obtiene todos los presupuestos de un mes con su progreso
 */
exports.getMonthBudgets = async (userId, month, year) => {
  return prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    orderBy: { amount: 'desc' }
  })
}
