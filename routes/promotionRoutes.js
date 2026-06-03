const express = require('express');
const router = express.Router();
const {
  applyPromotion,
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} = require('../controllers/promotionController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

// Public or logged-in users can apply coupon
router.post('/apply', protect, applyPromotion);
router.post('/validate', protect, applyPromotion); // Section 5 mapping

// Staff / Admin protected routes
router.get('/', protect, restrictTo('staff', 'admin'), getPromotions);

// Admin only routes
router.post('/', protect, restrictTo('admin'), createPromotion);
router.put('/:id', protect, restrictTo('admin'), updatePromotion);
router.delete('/:id', protect, restrictTo('admin'), deletePromotion);

module.exports = router;
