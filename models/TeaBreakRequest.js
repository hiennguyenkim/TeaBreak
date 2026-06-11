const mongoose = require('mongoose');

const teaBreakRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullname: {
      type: String,
      required: [true, 'Họ tên không được bỏ trống'],
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại không được bỏ trống'],
      set: val => val ? val.replace(/[\s\.\-\(\)]/g, '') : val,
      match: [
        /^(0|84|\+84)((3|5|7|8|9)[0-9]{8}|2[0-9]{9})$/,
        'Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0988888888)',
      ],
    },
    email: {
      type: String,
      required: [true, 'Email không được bỏ trống'],
    },
    packageType: {
      type: String, // Set tiệc ngọt, Set tiệc mặn, Set kết hợp
      required: true,
    },
    groupSize: {
      type: String, // 10-15 người, 20-30 người, 50+ người
      required: true,
    },
    teaOption: {
      type: String, // Trà Ô long, Trà Earl Grey, Trà hoa cúc, Trà hoa hồng
      required: true,
    },
    corporateName: {
      type: String, // Tên công ty / doanh nghiệp (Tùy chọn)
      default: '',
    },
    eventTheme: {
      type: String, // Chủ đề sự kiện (Tông màu xanh dương, tông vàng, v.v.)
      default: '',
    },
    sampleLayout: {
      type: String, // Ảnh sơ đồ bố trí hoặc ảnh mẫu tiệc trà tham khảo
      required: true,
    },
    expectedDate: {
      type: Date,
      required: [true, 'Ngày tổ chức tiệc không được bỏ trống'],
    },
    expectedTime: {
      type: String,
      required: [true, 'Khung giờ giao hàng không được bỏ trống'],
    },
    note: {
      type: String,
      default: '',
    },
    quotedPrice: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'received', 'consulting', 'quoted', 'confirmed', 'making', 'completed', 'cancelled'],
      default: 'pending',
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

module.exports = mongoose.model('TeaBreakRequest', teaBreakRequestSchema);
