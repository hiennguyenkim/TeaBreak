const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');

// Helper to generate order code
const generateOrderCode = () => {
  const chars = '0123456789';
  let result = 'SPB';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// @desc    Create new order (Checkout from Cart)
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      fullname,
      phone,
      email,
      address,
      deliveryDate,
      deliveryTime,
      paymentMethod,
      promoCode,
      note,
    } = req.body;

    // 1. Get user cart
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Giỏ hàng của bạn đang trống, không thể tiến hành đặt hàng',
      });
    }

    // 2. Validate product stock and status
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Sản phẩm với ID ${item.productId} không còn tồn tại`,
        });
      }
      if (['hidden', 'coming_soon'].includes(product.status)) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${product.name} tạm thời ngưng bán`,
        });
      }
      if (product.stock < item.quantity || product.status === 'out_of_stock') {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${product.name} không đủ hàng tồn kho (Tồn kho: ${product.stock}, Yêu cầu: ${item.quantity})`,
        });
      }
    }

    // 3. Process Promotion Discount
    let discountAmount = 0;
    let appliedPromo = null;

    if (promoCode) {
      appliedPromo = await Promotion.findOne({ code: promoCode.toUpperCase() });
      if (appliedPromo && appliedPromo.isValid(cart.totalAmount)) {
        if (appliedPromo.discountType === 'percentage') {
          discountAmount = Math.round(cart.totalAmount * (appliedPromo.discountValue / 100));
        } else {
          discountAmount = appliedPromo.discountValue;
        }

        // Coupon cannot exceed order total
        if (discountAmount > cart.totalAmount) {
          discountAmount = cart.totalAmount;
        }
      }
    }

    const finalAmount = cart.totalAmount - discountAmount;
    const orderCode = generateOrderCode();

    // 4. Create Order items snapshot
    const orderItems = [];
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      orderItems.push({
        productId: item.productId,
        name: product.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        flavor: item.flavor,
        note: item.note || '',
      });
    }

    // 5. Create the Order
    const order = await Order.create({
      orderCode,
      userId: req.user.id,
      fullname,
      phone,
      email,
      address,
      items: orderItems,
      totalAmount: cart.totalAmount,
      discountAmount,
      finalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'pending_confirm', // bank_transfer goes to pending_confirm
      orderStatus: 'pending',
      deliveryDate: new Date(deliveryDate),
      deliveryTime,
      note: note || '',
    });

    // 6. Update Promotion usages
    if (appliedPromo) {
      appliedPromo.usedCount += 1;
      await appliedPromo.save();
    }

    // 7. Deduct Product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
      
      // Update status if stock reaches 0
      const updatedProduct = await Product.findById(item.productId);
      if (updatedProduct.stock === 0) {
        updatedProduct.status = 'out_of_stock';
        await updatedProduct.save();
      }
    }

    // 8. Empty user cart
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Đặt bánh thành công!',
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Lỗi đặt hàng: ${error.message}`,
    });
  }
};

// @desc    Create manual order (Staff / Admin at counter or call)
// @route   POST /api/orders/manual
// @access  Private (Staff / Admin)
exports.createManualOrder = async (req, res) => {
  try {
    const {
      fullname,
      phone,
      email,
      address,
      items, // array of {productId, quantity, size, flavor, note}
      deliveryDate,
      deliveryTime,
      paymentMethod,
      paymentStatus,
      promoCode,
      note,
      staffNote,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng thủ công phải chứa ít nhất một sản phẩm bánh',
      });
    }

    // Process and validate items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy bánh với ID ${item.productId}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Bánh ${product.name} không đủ số lượng tồn kho (Tồn: ${product.stock})`,
        });
      }

      const price = product.discountPrice || product.price;
      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        productId: item.productId,
        name: product.name,
        price,
        quantity: item.quantity,
        size: item.size,
        flavor: item.flavor,
        note: item.note || '',
      });
    }

    // Promotion
    let discountAmount = 0;
    let appliedPromo = null;

    if (promoCode) {
      appliedPromo = await Promotion.findOne({ code: promoCode.toUpperCase() });
      if (appliedPromo && appliedPromo.isValid(totalAmount)) {
        if (appliedPromo.discountType === 'percentage') {
          discountAmount = Math.round(totalAmount * (appliedPromo.discountValue / 100));
        } else {
          discountAmount = appliedPromo.discountValue;
        }

        if (discountAmount > totalAmount) {
          discountAmount = totalAmount;
        }
      }
    }

    const finalAmount = totalAmount - discountAmount;
    const orderCode = generateOrderCode();

    const order = await Order.create({
      orderCode,
      fullname,
      phone,
      email,
      address,
      items: orderItems,
      totalAmount,
      discountAmount,
      finalAmount,
      paymentMethod,
      paymentStatus: paymentStatus || 'unpaid',
      orderStatus: 'confirmed', // Manual orders from staff are auto-confirmed
      deliveryDate: new Date(deliveryDate),
      deliveryTime,
      note: note || '',
      staffId: req.user.id,
    });

    // Update promotion usages
    if (appliedPromo) {
      appliedPromo.usedCount += 1;
      await appliedPromo.save();
    }

    // Deduct stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
      
      const updatedProduct = await Product.findById(item.productId);
      if (updatedProduct.stock === 0) {
        updatedProduct.status = 'out_of_stock';
        await updatedProduct.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thủ công thành công!',
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Lỗi tạo đơn thủ công: ${error.message}`,
    });
  }
};

// @desc    Get all orders (Customer sees their own, Staff/Admin sees all)
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    let filter = {};

    // Customers only see their own orders
    if (req.user.role === 'user') {
      filter.userId = req.user.id;
    } else {
      // Staff / Admin filters
      if (req.query.status) {
        filter.orderStatus = req.query.status;
      }
      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        filter.$or = [
          { orderCode: searchRegex },
          { phone: searchRegex },
          { fullname: searchRegex },
        ];
      }
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng này',
      });
    }

    // Access check: User must own the order, or be Staff/Admin
    if (req.user.role === 'user' && order.userId && order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập thông tin đơn hàng này',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Staff / Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng cần cập nhật',
      });
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = orderStatus;
    order.staffId = req.user.id;

    // If order goes to completed, mark paymentStatus as paid automatically if COD
    if (orderStatus === 'completed' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }

    // Restore stock if order is cancelled or refunded from non-cancelled status
    if (['cancelled', 'refunded'].includes(orderStatus) && !['cancelled', 'refunded'].includes(oldStatus)) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });

        // Set status back to available if it was out of stock
        const product = await Product.findById(item.productId);
        if (product.status === 'out_of_stock' && product.stock > 0) {
          product.status = 'available';
          await product.save();
        }
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công!',
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update order payment status
// @route   PUT /api/orders/:id/payment
// @access  Private (Staff / Admin only)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    order.paymentStatus = paymentStatus;
    order.staffId = req.user.id;

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thanh toán thành công!',
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cancel order (Customer self-cancel)
// @route   POST /api/orders/:id/cancel
// @access  Private (Customer only)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
      });
    }

    // Verify ownership
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đơn hàng này',
      });
    }

    // Business Rule: only cancel if status is pending
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được tiếp nhận sản xuất hoặc đang giao, không thể tự hủy. Vui lòng liên hệ cửa hàng để được hỗ trợ.',
      });
    }

    order.orderStatus = 'cancelled';
    
    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });

      const product = await Product.findById(item.productId);
      if (product.status === 'out_of_stock' && product.stock > 0) {
        product.status = 'available';
        await product.save();
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Đơn hàng của bạn đã được hủy thành công!',
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Track order without logging in
// @route   GET /api/orders/track
// @access  Public
exports.trackOrder = async (req, res) => {
  try {
    const { orderCode, phone } = req.query;

    if (!orderCode || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã đơn hàng và số điện thoại đặt hàng',
      });
    }

    const order = await Order.findOne({
      orderCode: orderCode.toUpperCase(),
      phone: phone.trim(),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin đơn hàng phù hợp với mã đơn và số điện thoại này',
      });
    }

    res.status(200).json({
      success: true,
      order: {
        orderCode: order.orderCode,
        fullname: order.fullname,
        address: order.address,
        items: order.items,
        totalAmount: order.totalAmount,
        discountAmount: order.discountAmount,
        finalAmount: order.finalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
        note: order.note,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
