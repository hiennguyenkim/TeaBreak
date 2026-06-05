const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getRequests,
  getRequest,
  quoteRequest,
  updateRequestStatus,
  acceptQuote,
  convertToOrder,
  updateRequest,
} = require('../controllers/teaBreakController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const { uploadTeaBreak } = require('../middlewares/uploadMiddleware');

router.use(protect); // All teabreak endpoints require login

const uploadFields = uploadTeaBreak.fields([
  { name: 'sampleLayout', maxCount: 1 },
  { name: 'sampleImage', maxCount: 1 }
]);

// Customer routes
router.post('/', restrictTo('user'), uploadFields, createRequest);
router.get('/my', restrictTo('user'), getMyRequests);
router.put('/:id', uploadFields, updateRequest);
router.post('/:id/accept', restrictTo('user'), acceptQuote);

// Staff / Admin routes
router.get('/', restrictTo('staff', 'admin'), getRequests);
router.post('/:id/convert', restrictTo('staff', 'admin'), convertToOrder);
router.put('/:id/quote', restrictTo('staff', 'admin'), quoteRequest);
router.put('/:id/status', restrictTo('staff', 'admin'), updateRequestStatus);

// Shared details route
router.get('/:id', getRequest);

module.exports = router;
