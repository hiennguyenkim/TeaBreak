const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    logoText: {
      type: String,
      default: 'Sweet Pink Bakery & Tea Break',
    },
    logoIcon: {
      type: String,
      default: '🍰',
    },
    footerDesc: {
      type: String,
      default: 'Cung cấp dịch vụ tiệc ngọt hội nghị, khai trương, tiệc trà chiều doanh nghiệp và các dòng mini cake tinh tế hàng đầu.',
    },
    socialFb: {
      type: String,
      default: '#',
    },
    socialInsta: {
      type: String,
      default: '#',
    },
    socialYoutube: {
      type: String,
      default: '#',
    },
    address: {
      type: String,
      default: '123 Đường Hồng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    },
    phone: {
      type: String,
      default: '0988.888.888',
    },
    email: {
      type: String,
      default: 'support@sweetpinkbakery.vn',
    },
    openingHours: {
      type: String,
      default: 'Mở cửa từ 07:30 - 21:00 hàng ngày (Cả ngày lễ)',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);
