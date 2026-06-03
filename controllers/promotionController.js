const Promotion = require('../models/Promotion');

// @desc    Apply coupon code to order
// @route   POST /api/promotions/apply
// @access  Private
exports.applyPromotion = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const amount = Number(orderAmount);

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã giảm giá',
      });
    }

    const promo = await Promotion.findOne({ code: code.toUpperCase() });
    if (!promo) {
      return res.status(404).json({
        success: false,
        message: 'Mã giảm giá không tồn tại',
      });
    }

    // Validate using helper method
    if (!promo.isValid(amount)) {
      const now = new Date();
      let reason = 'Mã giảm giá không còn hiệu lực';

      if (promo.status !== 'active') {
        reason = 'Mã giảm giá đã bị tạm ngưng sử dụng';
      } else if (now < promo.startDate) {
        reason = 'Chương trình khuyến mãi chưa bắt đầu';
      } else if (now > promo.expiryDate) {
        reason = 'Mã giảm giá đã hết hạn sử dụng';
      } else if (promo.usedCount >= promo.usageLimit) {
        reason = 'Mã giảm giá đã hết lượt sử dụng';
      } else if (amount < promo.minOrderAmount) {
        reason = `Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã này (Tối thiểu: ${promo.minOrderAmount.toLocaleString('vi-VN')}đ)`;
      }

      return res.status(400).json({
        success: false,
        message: reason,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discountType === 'percentage') {
      discountAmount = Math.round(amount * (promo.discountValue / 100));
    } else {
      discountAmount = promo.discountValue;
    }

    // Discount cannot exceed order amount
    if (discountAmount > amount) {
      discountAmount = amount;
    }

    const finalAmount = amount - discountAmount;

    res.status(200).json({
      success: true,
      message: 'Áp dụng mã giảm giá thành công!',
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount,
      finalAmount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= ADMIN OPERATIONS =================

// @desc    Get all promotions
// @route   GET /api/promotions
// @access  Private (Admin / Staff)
exports.getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: promotions.length,
      promotions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create promotion coupon
// @route   POST /api/promotions
// @access  Private (Admin only)
exports.createPromotion = async (req, res) => {
  try {
    const {
      code,
      name,
      discountType,
      discountValue,
      minOrderAmount,
      usageLimit,
      startDate,
      expiryDate,
      status,
    } = req.body;

    const promoExists = await Promotion.findOne({ code: code.toUpperCase() });
    if (promoExists) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá này đã tồn tại trên hệ thống',
      });
    }

    const promotion = await Promotion.create({
      code: code.toUpperCase(),
      name,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      usageLimit: Number(usageLimit),
      startDate: new Date(startDate),
      expiryDate: new Date(expiryDate),
      status: status || 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Tạo mã giảm giá thành công!',
      promotion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update promotion coupon
// @route   PUT /api/promotions/:id
// @access  Private (Admin only)
exports.updatePromotion = async (req, res) => {
  try {
    const {
      code,
      name,
      discountType,
      discountValue,
      minOrderAmount,
      usageLimit,
      startDate,
      expiryDate,
      status,
    } = req.body;

    let promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá',
      });
    }

    if (code) {
      const codeExists = await Promotion.findOne({ code: code.toUpperCase(), _id: { $ne: req.params.id } });
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá này đã được sử dụng',
        });
      }
      promotion.code = code.toUpperCase();
    }

    if (name) promotion.name = name;
    if (discountType) promotion.discountType = discountType;
    if (discountValue !== undefined) promotion.discountValue = Number(discountValue);
    if (minOrderAmount !== undefined) promotion.minOrderAmount = Number(minOrderAmount);
    if (usageLimit !== undefined) promotion.usageLimit = Number(usageLimit);
    if (startDate) promotion.startDate = new Date(startDate);
    if (expiryDate) promotion.expiryDate = new Date(expiryDate);
    if (status) promotion.status = status;

    await promotion.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật mã giảm giá thành công!',
      promotion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete promotion coupon
// @route   DELETE /api/promotions/:id
// @access  Private (Admin only)
exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá cần xóa',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa mã giảm giá thành công!',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
