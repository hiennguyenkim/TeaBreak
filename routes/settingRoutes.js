const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const { uploadProduct } = require('../middlewares/uploadMiddleware');

router.get('/', getSettings);
router.put('/', protect, restrictTo('admin'), uploadProduct.single('logoFile'), updateSettings);

module.exports = router;
