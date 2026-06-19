// src/services/emailService.js
const nodemailer = require('nodemailer')
const logger     = require('../config/logger')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
})

const fmt = (n) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

exports.sendBudgetAlert = async (user, budget, pct) => {
  if (!process.env.SMTP_USER) return
  const isExceeded = pct >= 1
  const color  = isExceeded ? '#A32D2D' : '#854F0B'
  const emoji  = isExceeded ? '⚠️' : '🔔'
  const title  = isExceeded
    ? `Superaste el presupuesto de ${budget.category.name}`
    : `Llevas el ${Math.round(pct * 100)}% del presupuesto de ${budget.category.name}`

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px">
    <div style="background:${color};color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <h2 style="margin:0;font-size:18px">${emoji} ${title}</h2>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px">
      <p style="color:#475569">Hola <strong>${user.name}</strong>,</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#64748b">Categoría</td><td style="text-align:right;font-weight:600">${budget.category.name}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Presupuesto</td><td style="text-align:right">${fmt(budget.amount)}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Gastado</td><td style="text-align:right;color:${color};font-weight:700">${fmt(budget.spent)}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Disponible</td><td style="text-align:right">${fmt(Math.max(0, budget.amount - budget.spent))}</td></tr>
      </table>
      <div style="background:#f8fafc;border-radius:8px;padding:12px;text-align:center;font-size:28px;font-weight:700;color:${color}">
        ${Math.round(pct * 100)}%
      </div>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px;text-align:center">
        Control de Gastos · Medellín 🇨🇴
      </p>
    </div>
  </div>`

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `${emoji} ${title}`,
      html
    })
    logger.info(`Email de alerta enviado a ${user.email}`)
  } catch (err) {
    logger.error(`Error enviando email: ${err.message}`)
  }
}

exports.sendWeeklySummary = async (user, summary) => {
  if (!process.env.SMTP_USER) return
  const rows = summary.byCategory.map(c =>
    `<tr><td style="padding:6px 0">${c.name}</td><td style="text-align:right">${fmt(c.total)}</td></tr>`
  ).join('')

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px">
    <div style="background:#1E293B;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <h2 style="margin:0">📊 Resumen semanal</h2>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px">
      <p>Hola <strong>${user.name}</strong>, aquí tu resumen de la semana:</p>
      <div style="text-align:center;padding:16px;background:#f0fdf4;border-radius:8px;margin-bottom:16px">
        <div style="font-size:12px;color:#64748b">Total gastado esta semana</div>
        <div style="font-size:32px;font-weight:700;color:#0F6E56">${fmt(summary.totalWeek)}</div>
      </div>
      <table style="width:100%;border-collapse:collapse">${rows}</table>
    </div>
  </div>`

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `📊 Tu resumen de gastos de la semana`,
      html
    })
  } catch (err) {
    logger.error(`Error enviando resumen: ${err.message}`)
  }
}
