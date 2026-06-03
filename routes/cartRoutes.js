const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');
const { applyPromotion } = require('../controllers/promotionController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // All cart routes require user login

router.get('/', getCart);

// Section 5 mappings
router.post('/', addToCart);
router.post('/items', addToCart);

router.put('/', updateCartItem);
router.put('/items/:productId', updateCartItem);

router.post('/remove', removeCartItem);
router.delete('/items/:productId', removeCartItem);

router.delete('/', clearCart);

router.post('/apply-promo', applyPromotion);

module.exports = router;
