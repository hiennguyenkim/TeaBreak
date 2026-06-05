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
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const { uploadAvatar } = require('../middlewares/uploadMiddleware');
const {
  validateProfileUpdate,
  validateAdminCreateUser,
  validateAdminUpdateUser,
  validateAddress,
} = require('../middlewares/validationMiddleware');

const { getMe } = require('../controllers/authController');

// Customer routes (logged in)
router.get('/me', protect, getMe);
router.put('/me', protect, uploadAvatar.single('avatarFile'), validateProfileUpdate, updateProfile);
router.put('/profile', protect, uploadAvatar.single('avatarFile'), validateProfileUpdate, updateProfile);
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, validateAddress, addAddress);
router.put('/addresses/:id', protect, validateAddress, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);

// Wishlist routes
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist', protect, addToWishlist);
router.delete('/wishlist/:id', protect, removeFromWishlist);

// Staff / Admin routes
router.get('/', protect, restrictTo('staff', 'admin'), getUsers);

// Admin only routes
router.post('/staff', protect, restrictTo('admin'), validateAdminCreateUser, createStaffAccount);
router.put('/:id/status', protect, restrictTo('admin'), updateUserStatus);
router.put('/:id/role', protect, restrictTo('admin'), updateUserRole);
router.post('/', protect, restrictTo('admin'), uploadAvatar.single('avatarFile'), validateAdminCreateUser, createUser);
router.put('/:id', protect, restrictTo('admin'), uploadAvatar.single('avatarFile'), validateAdminUpdateUser, updateUser);
router.delete('/:id', protect, restrictTo('admin'), deleteUser);

module.exports = router;
