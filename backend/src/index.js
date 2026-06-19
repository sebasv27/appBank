// src/index.js
require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const rateLimit  = require('express-rate-limit')

const logger          = require('./config/logger')
const { scheduleJobs } = require('./services/scheduler')

// Routes
const authRoutes        = require('./routes/auth')
const transactionRoutes = require('./routes/transactions')
const budgetRoutes      = require('./routes/budgets')
const categoryRoutes    = require('./routes/categories')
const goalRoutes        = require('./routes/goals')
const alertRoutes       = require('./routes/alerts')
const dashboardRoutes   = require('./routes/dashboard')
const webhookRoutes     = require('./routes/webhooks')

const app  = express()
const PORT = process.env.PORT || 4000

// ── Seguridad ──────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas solicitudes. Intenta en 15 minutos.' }
})
app.use('/api/', limiter)

// ── Parsing ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// ── Rutas ──────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/budgets',      budgetRoutes)
app.use('/api/categories',   categoryRoutes)
app.use('/api/goals',        goalRoutes)
app.use('/api/alerts',       alertRoutes)
app.use('/api/dashboard',    dashboardRoutes)
app.use('/api/webhooks',     webhookRoutes)

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }))

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(err.stack)
  const status  = err.status || 500
  const message = err.message || 'Error interno del servidor'
  res.status(status).json({ error: message })
})

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`)
  scheduleJobs()
})

module.exports = app
