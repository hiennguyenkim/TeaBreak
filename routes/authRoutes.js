const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  changePassword,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const {
  validateRegister,
  validateChangePassword,
  validateResetPassword,
} = require('../middlewares/validationMiddleware');

router.post('/register', validateRegister, register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.post('/change-password', protect, validateChangePassword, changePassword);

module.exports = router;
