const Setting = require('../models/Setting');
const { bufferToBase64 } = require('../middlewares/uploadMiddleware');

// @desc    Get store settings
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Không thể tải cài đặt: ${error.message}`,
    });
  }
};

// @desc    Update store settings
// @route   PUT /api/settings
// @access  Private (Admin only)
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }

    const fields = [
      'logoText',
      'logoIcon',
      'footerDesc',
      'socialFb',
      'socialInsta',
      'socialYoutube',
      'address',
      'phone',
      'email',
      'openingHours',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    if (req.file) {
      settings.logoIcon = bufferToBase64(req.file);
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật cài đặt giao diện & thông tin thành công!',
      settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Lỗi cập nhật cài đặt: ${error.message}`,
    });
  }
};
