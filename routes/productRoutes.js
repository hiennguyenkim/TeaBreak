const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  uploadProductImages,
} = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const { uploadProduct } = require('../middlewares/uploadMiddleware');

// Middleware helper to allow optional auth for getProducts
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

router.get('/', optionalAuth, getProducts);
router.get('/:idOrSlug', getProduct);

// Admin protected routes
router.post('/', protect, restrictTo('admin'), uploadProduct.array('images', 5), createProduct);
router.put('/:id', protect, restrictTo('admin'), uploadProduct.array('images', 5), updateProduct);
router.delete('/:id', protect, restrictTo('admin'), deleteProduct);

// Admin/Staff status route
router.put('/:id/status', protect, restrictTo('staff', 'admin'), updateProductStatus);

// Admin images upload route
router.post('/:id/images', protect, restrictTo('admin'), uploadProduct.array('images', 5), uploadProductImages);

module.exports = router;
