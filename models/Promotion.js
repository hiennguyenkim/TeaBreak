const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Vui lòng cung cấp mã giảm giá'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Vui lòng cung cấp tên chương trình'],
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Vui lòng chọn loại giảm giá (percentage hoặc fixed)'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Vui lòng cung cấp giá trị giảm giá'],
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageLimit: {
      type: Number,
      required: [true, 'Vui lòng giới hạn số lượng sử dụng'],
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      required: [true, 'Vui lòng chọn ngày bắt đầu'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Vui lòng chọn ngày hết hạn'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual check if expired or inactive
promotionSchema.methods.isValid = function (orderAmount) {
  const now = new Date();
  if (this.status !== 'active') return false;
  if (now < this.startDate || now > this.expiryDate) return false;
  if (this.usedCount >= this.usageLimit) return false;
  if (orderAmount < this.minOrderAmount) return false;
  return true;
};

module.exports = mongoose.model('Promotion', promotionSchema);
