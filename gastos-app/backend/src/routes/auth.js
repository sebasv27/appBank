// src/routes/auth.js
const router = require('express').Router()
const { body } = require('express-validator')
const ctrl   = require('../controllers/authController')
const auth   = require('../middleware/auth')

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Nombre requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  ],
  ctrl.register
)

router.post('/login',
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  ctrl.login
)

router.get('/me',       auth, ctrl.me)
router.put('/profile',  auth, ctrl.updateProfile)
router.post('/logout',  auth, ctrl.logout)

module.exports = router
