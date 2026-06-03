const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  size: {
    type: String,
    required: true,
  },
  flavor: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    trim: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    fullname: {
      type: String,
      required: [true, 'Vui lòng cung cấp họ tên người nhận'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Vui lòng cung cấp số điện thoại người nhận'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Vui lòng cung cấp email liên hệ'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Vui lòng cung cấp địa chỉ nhận hàng'],
      trim: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'bank_transfer', 'e_wallet'],
      required: [true, 'Vui lòng chọn phương thức thanh toán'],
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending_confirm', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
    },
    orderStatus: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'preparing',
        'shipping',
        'delivered',
        'completed',
        'cancelled',
        'refunded',
      ],
      default: 'pending',
    },
    deliveryDate: {
      type: Date,
      required: [true, 'Vui lòng chọn ngày nhận bánh'],
    },
    deliveryTime: {
      type: String,
      required: [true, 'Vui lòng chọn giờ nhận bánh'],
    },
    note: {
      type: String,
      trim: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
