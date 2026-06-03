const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper to get or create cart for user
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [], totalAmount: 0 });
  }
  return cart;
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.productId', 'name slug code images stock price discountPrice status');

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: { items: [], totalAmount: 0 },
      });
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add product to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, size, flavor, note } = req.body;
    const qty = parseInt(quantity, 10) || 1;

    // Check product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm bánh không tồn tại',
      });
    }

    // Check status
    if (['hidden', 'coming_soon'].includes(product.status)) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm này chưa mở bán hoặc tạm thời ẩn',
      });
    }

    // Check stock
    if (product.stock < qty || product.status === 'out_of_stock') {
      return res.status(400).json({
        success: false,
        message: `Số lượng đặt hàng vượt quá tồn kho hiện tại (Tồn kho: ${product.stock})`,
      });
    }

    const cart = await getOrCreateCart(req.user.id);

    // Check if the item already exists in the cart (with same variations: size & flavor)
    const itemIndex = cart.items.findIndex(item =>
      item.productId.toString() === productId &&
      item.size === size &&
      item.flavor === flavor
    );

    const price = product.discountPrice || product.price;

    if (itemIndex > -1) {
      // Item exists, update quantity
      const newQty = cart.items[itemIndex].quantity + qty;
      if (product.stock < newQty) {
        return res.status(400).json({
          success: false,
          message: `Tổng số lượng trong giỏ (${newQty}) vượt quá tồn kho hiện tại (Tồn kho: ${product.stock})`,
        });
      }
      cart.items[itemIndex].quantity = newQty;
      cart.items[itemIndex].price = price;
      if (note !== undefined) cart.items[itemIndex].note = note;
    } else {
      // Item does not exist, push to array
      cart.items.push({
        productId,
        quantity: qty,
        price,
        size,
        flavor,
        note: note || '',
      });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Đã thêm sản phẩm vào giỏ hàng!',
      cart,
    });
  } catch (error) {
    console.error('ERROR IN ADD_TO_CART:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const { size, flavor, quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng đặt bánh phải lớn hơn hoặc bằng 1',
      });
    }

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Giỏ hàng của bạn trống',
      });
    }

    // Find the item
    const itemIndex = cart.items.findIndex(item =>
      item.productId.toString() === productId &&
      item.size === size &&
      item.flavor === flavor
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm này trong giỏ hàng',
      });
    }

    // Check product stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm bánh đã bị gỡ khỏi hệ thống',
      });
    }

    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Số lượng đặt hàng vượt quá tồn kho hiện tại (Tồn kho: ${product.stock})`,
      });
    }

    // Update quantity
    cart.items[itemIndex].quantity = qty;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name slug code images stock price discountPrice status');

    res.status(200).json({
      success: true,
      message: 'Cập nhật số lượng thành công!',
      cart: populatedCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/item
// @access  Private
exports.removeCartItem = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const { size, flavor } = req.body;

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Giỏ hàng trống',
      });
    }

    cart.items = cart.items.filter(item => !(
      item.productId.toString() === productId &&
      item.size === size &&
      item.flavor === flavor
    ));

    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name slug code images stock price discountPrice status');

    res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng!',
      cart: populatedCart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      cart.items = [];
      cart.totalAmount = 0;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Giỏ hàng đã được xóa sạch!',
      cart: { items: [], totalAmount: 0 },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
