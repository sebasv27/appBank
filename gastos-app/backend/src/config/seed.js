// src/config/seed.js
// Script opcional: crea un usuario de prueba con datos de ejemplo
require('dotenv').config()
const bcrypt = require('bcryptjs')
const prisma = require('./prisma')
const { seedDefaultCategories } = require('../services/categoryService')

async function main() {
  console.log('🌱 Sembrando datos de ejemplo...')

  const existing = await prisma.user.findUnique({ where: { email: 'demo@gastos.com' } })
  if (existing) {
    console.log('El usuario demo ya existe. Saltando.')
    return
  }

  const hashed = await bcrypt.hash('demo123456', 12)
  const user = await prisma.user.create({
    data: {
      name: 'Sebs',
      email: 'demo@gastos.com',
      password: hashed,
      monthlyIncome: 3000000
    }
  })

  await seedDefaultCategories(user.id)
  const categories = await prisma.category.findMany({ where: { userId: user.id } })
  const catByName  = Object.fromEntries(categories.map(c => [c.name, c.id]))

  const now = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  // Presupuestos del plan original
  const budgets = [
    ['Arriendo', 1000000], ['Alimentación', 450000], ['Transporte', 150000],
    ['Servicios', 200000], ['Ahorro', 300000], ['Deuda', 700000],
  ]
  for (const [name, amount] of budgets) {
    if (!catByName[name]) continue
    await prisma.budget.create({
      data: { userId: user.id, categoryId: catByName[name], amount, month, year }
    })
  }

  // Transacciones de ejemplo
  const sampleTx = [
    ['Arriendo', 1000000, 'Pago arriendo apartamento', 1],
    ['Alimentación', 85000, 'Mercado D1', 3],
    ['Alimentación', 32000, 'Almuerzo ejecutivo', 5],
    ['Transporte', 15000, 'Uber al trabajo', 5],
    ['Servicios', 95000, 'Factura EPM', 8],
    ['Entretenimiento', 45000, 'Cine con amigos', 10],
  ]
  for (const [cat, amount, desc, day] of sampleTx) {
    if (!catByName[cat]) continue
    await prisma.transaction.create({
      data: {
        userId: user.id, categoryId: catByName[cat],
        amount, description: desc,
        date: new Date(year, month - 1, day),
        type: 'EXPENSE', source: 'MANUAL'
      }
    })
  }

  // Meta de ejemplo
  await prisma.goal.create({
    data: {
      userId: user.id, name: 'Pagar deuda total',
      targetAmount: 5000000, savedAmount: 1500000,
      color: '#A32D2D', icon: 'credit-card'
    }
  })

  console.log('✅ Usuario demo creado:')
  console.log('   Email: demo@gastos.com')
  console.log('   Password: demo123456')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
