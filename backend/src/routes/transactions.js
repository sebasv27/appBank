// src/routes/transactions.js
const router = require('express').Router()
const { body, query } = require('express-validator')
const ctrl = require('../controllers/transactionController')
const auth = require('../middleware/auth')

router.use(auth)

router.get('/',    ctrl.list)
router.post('/',
  [
    body('amount').isFloat({ min: 1 }).withMessage('Monto inválido'),
    body('description').trim().notEmpty().withMessage('Descripción requerida'),
    body('date').optional().isISO8601()
  ],
  ctrl.create
)
router.get('/export',   ctrl.exportCSV)
router.get('/:id',      ctrl.getOne)
router.put('/:id',      ctrl.update)
router.delete('/:id',   ctrl.remove)

module.exports = router
