const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const { uploadProduct } = require('../middlewares/uploadMiddleware');

// Middleware helper to allow optional auth for getCategories
const optionalAuth = (req, res, next) => {
  const jwt = require('jsonwebtoken');
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = require('../models/User');
    User.findById(decoded.id).then(user => {
      if (user) {
        req.user = user;
      }
      next();
    }).catch(() => next());
  } catch (error) {
    next();
  }
};

router.get('/', optionalAuth, getCategories);
router.get('/:idOrSlug', getCategory);

// Protected admin routes
router.post('/', protect, restrictTo('admin'), uploadProduct.single('image'), createCategory);
router.put('/:id', protect, restrictTo('admin'), uploadProduct.single('image'), updateCategory);
router.delete('/:id', protect, restrictTo('admin'), deleteCategory);

module.exports = router;
