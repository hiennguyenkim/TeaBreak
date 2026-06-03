const express = require('express');
const router = express.Router();
const {
  createOrder,
  createManualOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  trackOrder,
} = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

// Public order tracking (no login required)
router.get('/track', trackOrder);

// Customer logged-in routes
router.post('/', protect, restrictTo('user'), createOrder);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrder);
router.post('/:id/cancel', protect, restrictTo('user'), cancelOrder);
router.put('/:id/cancel', protect, cancelOrder); // Section 5 mapping

// Staff / Admin protected routes
router.get('/all', protect, restrictTo('staff', 'admin'), getOrders); // Section 5 mapping
router.post('/manual', protect, restrictTo('staff', 'admin'), createManualOrder);
router.put('/:id/status', protect, restrictTo('staff', 'admin'), updateOrderStatus);
router.put('/:id/payment', protect, restrictTo('staff', 'admin'), updatePaymentStatus);

module.exports = router;
