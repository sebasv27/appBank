// src/services/scheduler.js
const cron         = require('node-cron')
const prisma       = require('../config/prisma')
const emailService = require('./emailService')
const logger       = require('../config/logger')

exports.scheduleJobs = () => {
  // Resumen semanal — todos los lunes a las 8am
  cron.schedule('0 8 * * 1', async () => {
    logger.info('Ejecutando resumen semanal...')
    try {
      const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } })
      const now   = new Date()
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

      for (const user of users) {
        const txs = await prisma.transaction.findMany({
          where: { userId: user.id, type: 'EXPENSE', date: { gte: weekAgo } },
          include: { category: { select: { name: true } } }
        })
        if (txs.length === 0) continue

        const totalWeek = txs.reduce((s, t) => s + t.amount, 0)
        const byCategory = Object.values(
          txs.reduce((acc, t) => {
            const name = t.category?.name || 'Otros'
            acc[name] = acc[name] || { name, total: 0 }
            acc[name].total += t.amount
            return acc
          }, {})
        ).sort((a, b) => b.total - a.total)

        await emailService.sendWeeklySummary(user, { totalWeek, byCategory })

        await prisma.alert.create({
          data: {
            userId: user.id,
            type: 'WEEKLY_SUMMARY',
            message: `Tu gasto esta semana fue $${totalWeek.toLocaleString('es-CO')}`,
            metadata: { totalWeek, byCategory }
          }
        })
      }
    } catch (err) {
      logger.error(`Error en resumen semanal: ${err.message}`)
    }
  }, { timezone: 'America/Bogota' })

  logger.info('⏰ Jobs programados activos')
}
