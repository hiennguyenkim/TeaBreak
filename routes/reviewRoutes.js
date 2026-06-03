const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getReviews,
  updateReviewStatus,
  replyReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const { uploadReview } = require('../middlewares/uploadMiddleware');

// Get product reviews is public
router.get('/product/:productId', getProductReviews);

// Protected routes
router.post('/', protect, restrictTo('user'), uploadReview.array('images', 3), createReview);

// Staff / Admin routes
router.get('/', protect, restrictTo('staff', 'admin'), getReviews);
router.post('/:id/reply', protect, restrictTo('staff', 'admin'), replyReview);
router.put('/:id/reply', protect, restrictTo('staff', 'admin'), replyReview); // Section 5 mapping

// Admin only routes
router.put('/:id/status', protect, restrictTo('admin'), updateReviewStatus);
router.delete('/:id', protect, restrictTo('admin'), deleteReview);

module.exports = router;
