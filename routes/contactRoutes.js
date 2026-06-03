const express = require('express');
const router = express.Router();
const {
  createContact,
  getContacts,
  replyContact,
  updateContactStatus,
} = require('../controllers/contactController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

router.post('/', createContact);

// Protected Staff / Admin routes
router.get('/', protect, restrictTo('staff', 'admin'), getContacts);
router.put('/:id/reply', protect, restrictTo('staff', 'admin'), replyContact);
router.put('/:id/status', protect, restrictTo('staff', 'admin'), updateContactStatus);
router.put('/:id', protect, restrictTo('staff', 'admin'), replyContact);

module.exports = router;
