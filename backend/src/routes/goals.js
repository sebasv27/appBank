// src/routes/goals.js
const router = require('express').Router()
const auth   = require('../middleware/auth')
const prisma = require('../config/prisma')

router.use(auth)

router.get('/', async (req, res) => {
  const data = await prisma.goal.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' }
  })
  res.json({ data })
})

router.post('/', async (req, res) => {
  const { name, targetAmount, deadline, icon, color } = req.body
  const goal = await prisma.goal.create({
    data: {
      name, targetAmount: parseFloat(targetAmount),
      deadline: deadline ? new Date(deadline) : null,
      icon: icon || 'target',
      color: color || '#185FA5',
      userId: req.user.id
    }
  })
  res.status(201).json({ data: goal })
})

router.put('/:id', async (req, res) => {
  const { savedAmount, status, name, targetAmount, deadline } = req.body
  const goal = await prisma.goal.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: {
      ...(savedAmount   !== undefined && { savedAmount: parseFloat(savedAmount) }),
      ...(status        && { status }),
      ...(name          && { name }),
      ...(targetAmount  && { targetAmount: parseFloat(targetAmount) }),
      ...(deadline      && { deadline: new Date(deadline) })
    }
  })
  res.json({ data: goal })
})

router.delete('/:id', async (req, res) => {
  await prisma.goal.deleteMany({ where: { id: req.params.id, userId: req.user.id } })
  res.json({ message: 'Eliminado' })
})

module.exports = router
