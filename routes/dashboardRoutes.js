const express = require('express');
const router = express.Router();
const {
  getStaffStats,
  getAdminStats,
  getRevenueReport,
} = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

router.use(protect);

router.get('/staff', restrictTo('staff', 'admin'), getStaffStats);
router.get('/admin', restrictTo('admin'), getAdminStats);
router.get('/revenue-report', restrictTo('admin'), getRevenueReport);

module.exports = router;
