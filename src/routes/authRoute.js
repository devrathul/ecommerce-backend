const express = require('express')
const authController = require('../controllers/authController')
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/signup', authController.SignupUser)
router.post('/login', authController.LogInUser)
router.get('/me', authenticateToken, authController.GetCurrentUser)
router.get(
    '/admin-check',
    authenticateToken,
    authorizeRoles('admin'),
    (req, res) => {
        res.status(200).json({ message: "Admin access granted" })
    }
)

module.exports = router