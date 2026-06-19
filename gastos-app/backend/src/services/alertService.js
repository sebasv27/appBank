// src/services/alertService.js
const prisma       = require('../config/prisma')
const emailService = require('./emailService')
const logger       = require('../config/logger')

/**
 * Verifica si el usuario llegó al umbral de un presupuesto
 * y crea una alerta si es necesario
 */
exports.checkBudgetAlerts = async (userId, categoryId, date) => {
  try {
    const month = date.getMonth() + 1
    const year  = date.getFullYear()

    const budget = await prisma.budget.findUnique({
      where: { userId_categoryId_month_year: { userId, categoryId, month, year } },
      include: { category: true, user: true }
    })
    if (!budget) return

    const pct = budget.spent / budget.amount

    if (pct >= 1) {
      // Presupuesto excedido
      await createAlert(userId, 'BUDGET_EXCEEDED', {
        message: `⚠️ Superaste el presupuesto de ${budget.category.name} este mes`,
        metadata: { categoryId, budgetId: budget.id, spent: budget.spent, amount: budget.amount, pct }
      })
      await emailService.sendBudgetAlert(budget.user, budget, pct)

    } else if (pct >= budget.alertAt) {
      // Cerca del límite (80% por defecto)
      const alreadySent = await prisma.alert.findFirst({
        where: {
          userId,
          type: 'BUDGET_WARNING',
          createdAt: { gte: new Date(year, month - 1, 1) },
          metadata: { path: ['categoryId'], equals: categoryId }
        }
      })
      if (!alreadySent) {
        await createAlert(userId, 'BUDGET_WARNING', {
          message: `🔔 Llevas el ${Math.round(pct * 100)}% del presupuesto de ${budget.category.name}`,
          metadata: { categoryId, budgetId: budget.id, spent: budget.spent, amount: budget.amount, pct }
        })
        await emailService.sendBudgetAlert(budget.user, budget, pct)
      }
    }
  } catch (err) {
    logger.error(`checkBudgetAlerts: ${err.message}`)
  }
}

/**
 * Crea alerta de gasto inusual (monto > 2x promedio histórico de la categoría)
 */
exports.checkUnusualExpense = async (userId, categoryId, amount) => {
  try {
    const past = await prisma.transaction.aggregate({
      where: { userId, categoryId, type: 'EXPENSE',
        date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      },
      _avg: { amount: true }
    })
    const avg = past._avg.amount || 0
    if (avg > 0 && amount > avg * 2.5) {
      await createAlert(userId, 'UNUSUAL_EXPENSE', {
        message: `💡 Gasto inusual detectado: $${amount.toLocaleString('es-CO')} (promedio: $${Math.round(avg).toLocaleString('es-CO')})`,
        metadata: { categoryId, amount, avg }
      })
    }
  } catch (err) {
    logger.error(`checkUnusualExpense: ${err.message}`)
  }
}

const createAlert = async (userId, type, { message, metadata }) => {
  return prisma.alert.create({ data: { userId, type, message, metadata } })
}

exports.createAlert = createAlert
