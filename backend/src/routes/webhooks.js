// src/routes/webhooks.js
/**
 * Endpoint que recibirá notificaciones del parser Android en Fase 3.
 * La app Android leerá las notificaciones de Bancolombia/Nequi y
 * las enviará aquí en tiempo real.
 */
const router = require('express').Router()
const prisma = require('../config/prisma')
const jwt    = require('jsonwebtoken')
const alertService  = require('../services/alertService')
const budgetService = require('../services/budgetService')
const logger = require('../config/logger')

// Middleware auth ligero para webhooks (token en header X-Device-Token)
const deviceAuth = async (req, res, next) => {
  try {
    const token = req.headers['x-device-token']
    if (!token) return res.status(401).json({ error: 'Token requerido' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.id
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

/**
 * POST /api/webhooks/notification
 * Body: { rawText, source: 'BANCOLOMBIA' | 'NEQUI', amount, description, date }
 *
 * En Fase 3 el parser Android enviará el texto crudo de la notificación
 * y el monto ya parseado. El backend lo guarda y actualiza presupuestos.
 */
router.post('/notification', deviceAuth, async (req, res) => {
  try {
    const { rawText, source = 'NOTIFICATION', amount, description, categoryId, date } = req.body

    if (!amount || amount <= 0)
      return res.status(400).json({ error: 'Monto inválido' })

    const transaction = await prisma.transaction.create({
      data: {
        amount:      parseFloat(amount),
        description: description || 'Notificación bancaria',
        type:        'EXPENSE',
        source:      'NOTIFICATION',
        rawNotif:    rawText,
        date:        date ? new Date(date) : new Date(),
        userId:      req.userId,
        categoryId
      },
      include: { category: true }
    })

    if (categoryId) {
      await budgetService.updateSpent(req.userId, categoryId, transaction.date)
      await alertService.checkBudgetAlerts(req.userId, categoryId, transaction.date)
    }

    logger.info(`Webhook: transacción ${transaction.id} creada desde ${source}`)
    res.status(201).json({ data: transaction })
  } catch (err) {
    logger.error(`Webhook error: ${err.message}`)
    res.status(500).json({ error: 'Error procesando notificación' })
  }
})

module.exports = router
