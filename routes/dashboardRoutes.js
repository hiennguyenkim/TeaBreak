const express = require('express');
const router = express.Router();
const {
  getStaffStats,
  getAdminStats,
  getRevenueReport,
  getProductReport,
} = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

router.use(protect);

router.get('/staff', restrictTo('staff', 'admin'), getStaffStats);
router.get('/admin', restrictTo('admin'), getAdminStats);
router.get('/revenue-report', restrictTo('admin'), getRevenueReport);
router.get('/product-report/:productId', restrictTo('admin'), getProductReport);

module.exports = router;
