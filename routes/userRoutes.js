const express = require('express');
const router = express.Router();
const {
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getUsers,
  updateUserStatus,
  updateUserRole,
  createStaffAccount,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const { uploadAvatar } = require('../middlewares/uploadMiddleware');

const { getMe } = require('../controllers/authController');

// Customer routes (logged in)
router.get('/me', protect, getMe);
router.put('/me', protect, uploadAvatar.single('avatarFile'), updateProfile);
router.put('/profile', protect, uploadAvatar.single('avatarFile'), updateProfile);
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);

// Staff / Admin routes
router.get('/', protect, restrictTo('staff', 'admin'), getUsers);

// Admin only routes
router.post('/staff', protect, restrictTo('admin'), createStaffAccount);
router.put('/:id/status', protect, restrictTo('admin'), updateUserStatus);
router.put('/:id/role', protect, restrictTo('admin'), updateUserRole);
router.post('/', protect, restrictTo('admin'), uploadAvatar.single('avatarFile'), createUser);
router.put('/:id', protect, restrictTo('admin'), uploadAvatar.single('avatarFile'), updateUser);
router.delete('/:id', protect, restrictTo('admin'), deleteUser);

module.exports = router;
