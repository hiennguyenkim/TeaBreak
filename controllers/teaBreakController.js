const TeaBreakRequest = require('../models/TeaBreakRequest');
const Order = require('../models/Order');
const { bufferToBase64 } = require('../middlewares/uploadMiddleware');

// Helper to generate order code
const generateOrderCode = () => {
  const chars = '0123456789';
  let result = 'SPB';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// @desc    Submit a teabreak catering request
// @route   POST /api/teabreak-requests
// @access  Private (Customer only)
exports.createRequest = async (req, res) => {
  try {
    const {
      fullname,
      phone,
      email,
      packageType,
      cakeType,
      groupSize,
      size,
      teaOption,
      flavor,
      corporateName,
      mainColor,
      eventTheme,
      textOnCake,
      expectedDate,
      expectedTime,
      note,
    } = req.body;

    let file = req.file;
    if (!file && req.files) {
      if (req.files['sampleLayout'] && req.files['sampleLayout'][0]) {
        file = req.files['sampleLayout'][0];
      } else if (req.files['sampleImage'] && req.files['sampleImage'][0]) {
        file = req.files['sampleImage'][0];
      }
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp sơ đồ bố trí hoặc hình ảnh tham khảo',
      });
    }

    const sampleLayout = bufferToBase64(file);
    const finalPackageType = packageType || cakeType || 'Set tiệc ngọt';
    const finalGroupSize = groupSize || size || '10-15 người';
    const finalTeaOption = teaOption || flavor || 'Trà Ô long cam đào';
    const finalCorporateName = corporateName || mainColor || '';
    const finalEventTheme = eventTheme || textOnCake || '';

    const request = await TeaBreakRequest.create({
      userId: req.user.id,
      fullname,
      phone,
      email,
      packageType: finalPackageType,
      groupSize: finalGroupSize,
      teaOption: finalTeaOption,
      corporateName: finalCorporateName,
      eventTheme: finalEventTheme,
      sampleLayout,
      expectedDate: new Date(expectedDate),
      expectedTime,
      note,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Gửi yêu cầu dịch vụ Tea Break thành công! Nhân viên sẽ liên hệ báo giá sớm nhất.',
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get logged in user's own teabreak requests
// @route   GET /api/teabreak-requests/my
// @access  Private (Customer only)
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await TeaBreakRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all teabreak requests
// @route   GET /api/teabreak-requests
// @access  Private (Staff / Admin)
exports.getRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await TeaBreakRequest.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single teabreak request
// @route   GET /api/teabreak-requests/:id
// @access  Private
exports.getRequest = async (req, res) => {
  try {
    const request = await TeaBreakRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu đặt dịch vụ',
      });
    }

    // Access check
    if (req.user.role === 'user' && request.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập yêu cầu này',
      });
    }

    res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Staff reports quotation price
// @route   PUT /api/teabreak-requests/:id/quote
// @access  Private (Staff / Admin)
exports.quoteRequest = async (req, res) => {
  try {
    const { quotedPrice, note } = req.body;
    const request = await TeaBreakRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu đặt dịch vụ',
      });
    }

    request.quotedPrice = Number(quotedPrice);
    if (note) request.note = `${request.note || ''}\n[Báo giá từ tiệm]: ${note}`;
    request.status = 'quoted';
    request.staffId = req.user.id;

    await request.save();

    res.status(200).json({
      success: true,
      message: 'Báo giá thành công! Đã gửi thông báo đến khách hàng.',
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update teabreak request status
// @route   PUT /api/teabreak-requests/:id/status
// @access  Private (Staff / Admin)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await TeaBreakRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu',
      });
    }

    request.status = status;
    request.staffId = req.user.id;
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái yêu cầu đặt dịch vụ thành công!',
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    User accepts quotation price and turns it into an Order
// @route   POST /api/teabreak-requests/:id/accept
// @access  Private (Customer only)
exports.acceptQuote = async (req, res) => {
  try {
    const { paymentMethod, address } = req.body;
    const request = await TeaBreakRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu đặt dịch vụ',
      });
    }

    if (request.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này',
      });
    }

    if (request.status !== 'quoted' && request.status !== 'received') {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu của bạn chưa được báo giá hoặc đã được xác nhận đặt tiệc rồi',
      });
    }

    if (!request.quotedPrice || request.quotedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xác nhận yêu cầu chưa có báo giá từ tiệm',
      });
    }

    // Convert into Order
    const orderCode = generateOrderCode();
    
    const mongoose = require('mongoose');
    const Product = require('../models/Product');
    const anyProduct = await Product.findOne();
    const productId = anyProduct ? anyProduct._id : new mongoose.Types.ObjectId();

    const orderItems = [{
      productId: productId,
      name: `[GÓI TIỆC TEA BREAK] ${request.packageType} - Quy mô ${request.groupSize}`,
      price: request.quotedPrice,
      quantity: 1,
      size: request.groupSize,
      flavor: request.teaOption,
      note: `Doanh nghiệp: ${request.corporateName || 'Không có'}. Chủ đề: ${request.eventTheme || 'Không có'}. Sơ đồ: ${request.sampleLayout}. Ghi chú: ${request.note || ''}`,
    }];

    const order = await Order.create({
      orderCode,
      userId: req.user.id,
      fullname: request.fullname,
      phone: request.phone,
      email: request.email,
      address: address || request.note || 'Tổ chức tại địa chỉ công ty',
      items: orderItems,
      totalAmount: request.quotedPrice,
      discountAmount: 0,
      finalAmount: request.quotedPrice,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'pending_confirm',
      orderStatus: 'confirmed', // Auto-confirmed on quote acceptance
      deliveryDate: request.expectedDate,
      deliveryTime: request.expectedTime,
      note: `Đơn hàng đặt trọn gói Tea Break từ yêu cầu: #${request._id}`,
    });

    // Update request status
    request.status = 'confirmed';
    await request.save();

    res.status(201).json({
      success: true,
      message: 'Xác nhận báo giá thành công! Đơn hàng tiệc Tea Break đã được tạo.',
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Convert teabreak request to order
// @route   POST /api/teabreak-requests/:id/convert
// @access  Private (Staff / Admin)
exports.convertToOrder = async (req, res) => {
  try {
    const request = await TeaBreakRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu đặt dịch vụ',
      });
    }

    const quotedPrice = req.body.quotedPrice || request.quotedPrice;
    if (!quotedPrice || quotedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu chưa được báo giá hoặc giá không hợp lệ',
      });
    }

    // Convert into Order
    const orderCode = generateOrderCode();
    
    const mongoose = require('mongoose');
    const Product = require('../models/Product');
    const anyProduct = await Product.findOne();
    const productId = anyProduct ? anyProduct._id : new mongoose.Types.ObjectId();

    const orderItems = [{
      productId: productId,
      name: `[GÓI TIỆC TEA BREAK] ${request.packageType} - Quy mô ${request.groupSize}`,
      price: quotedPrice,
      quantity: 1,
      size: request.groupSize,
      flavor: request.teaOption,
      note: `Doanh nghiệp: ${request.corporateName || 'Không có'}. Chủ đề: ${request.eventTheme || 'Không có'}. Sơ đồ: ${request.sampleLayout}. Ghi chú: ${request.note || ''}`,
    }];

    const order = await Order.create({
      orderCode,
      userId: request.userId,
      fullname: request.fullname,
      phone: request.phone,
      email: request.email,
      address: req.body.address || request.note || 'Tổ chức tại địa chỉ công ty',
      items: orderItems,
      totalAmount: quotedPrice,
      discountAmount: 0,
      finalAmount: quotedPrice,
      paymentMethod: req.body.paymentMethod || 'cod',
      paymentStatus: 'unpaid',
      orderStatus: 'confirmed',
      deliveryDate: request.expectedDate,
      deliveryTime: request.expectedTime,
      note: `Đơn hàng đặt trọn gói chuyển đổi bởi nhân viên từ yêu cầu: #${request._id}`,
      staffId: req.user.id
    });

    request.status = 'confirmed';
    request.quotedPrice = quotedPrice;
    request.staffId = req.user.id;
    await request.save();

    res.status(201).json({
      success: true,
      message: 'Chuyển đổi yêu cầu thành đơn hàng thành công!',
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
