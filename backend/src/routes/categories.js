// src/routes/categories.js
const router = require('express').Router()
const auth   = require('../middleware/auth')
const prisma = require('../config/prisma')

router.use(auth)

router.get('/', async (req, res) => {
  const data = await prisma.category.findMany({
    where: { OR: [{ userId: req.user.id }, { isDefault: true }] },
    orderBy: { name: 'asc' }
  })
  res.json({ data })
})

router.post('/', async (req, res) => {
  const { name, icon, color } = req.body
  const cat = await prisma.category.create({
    data: { name, icon: icon || 'circle', color: color || '#0F6E56', userId: req.user.id }
  })
  res.status(201).json({ data: cat })
})

router.delete('/:id', async (req, res) => {
  await prisma.category.deleteMany({ where: { id: req.params.id, userId: req.user.id } })
  res.json({ message: 'Eliminado' })
})

module.exports = router
