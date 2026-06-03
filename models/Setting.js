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
    mapEmbed: {
      type: String,
      default: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.460288856865!2d106.69931327583803!3d10.776019659196525!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4625b5d56b%3A0xc48c081706f376f9!2zMTIzIMSQxrDhu51uZyBI4buTbmcsIFBoxrDhu51uZyBC4bq_biBOZ2jDqSwgUXXhuq1uIDEsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaA!5e0!3m2!1svi!2svn!4v1780000000000!5m2!1svi!2svn" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);
