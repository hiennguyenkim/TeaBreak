const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng cung cấp họ tên'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Vui lòng cung cấp email'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Vui lòng cung cấp số điện thoại'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Vui lòng cung cấp chủ đề liên hệ'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Vui lòng cung cấp nội dung liên hệ'],
      trim: true,
    },
    orderCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'processing', 'done', 'rejected'],
      default: 'new',
    },
    staffReply: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Contact', contactSchema);
