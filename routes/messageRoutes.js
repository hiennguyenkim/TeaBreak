const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  getConversationsList,
  getSupportRecipient,
} = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');

router.use(protect); // Logged in only

router.post('/', sendMessage);
router.get('/support/recipient', getSupportRecipient);
router.get('/', getConversationsList);
router.get('/conversations/list', getConversationsList);
router.get('/:otherUserId', getMessages);

module.exports = router;
