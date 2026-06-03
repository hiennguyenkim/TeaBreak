const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { bufferToBase64 } = require('../middlewares/uploadMiddleware');

// @desc    Submit review for a product
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { orderId, productId, rating, content } = req.body;

    // Check if the order exists, is completed and belongs to the user
    const order = await Order.findOne({ _id: orderId, userId: req.user.id });
    if (!order) {
      return res.status(400).json({
        success: false,
        message: 'Bạn chỉ được đánh giá sản phẩm của đơn hàng do chính bạn mua',
      });
    }

    if (order.orderStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng phải ở trạng thái "Hoàn thành" mới có thể gửi đánh giá',
      });
    }

    // Check if the product was part of the order
    const productInOrder = order.items.find(item => item.productId.toString() === productId);
    if (!productInOrder) {
      return res.status(400).json({
        success: false,
        message: 'Bánh này không thuộc danh sách sản phẩm bạn đã mua ở đơn hàng này',
      });
    }

    // Check if user already reviewed this product for this order
    const reviewExists = await Review.findOne({ userId: req.user.id, orderId, productId });
    if (reviewExists) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi',
      });
    }

    // Process uploaded review images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => bufferToBase64(file));
    }

    const review = await Review.create({
      userId: req.user.id,
      productId,
      orderId,
      rating: Number(rating),
      content,
      images,
      status: 'pending', // Starts in pending review
    });

    res.status(201).json({
      success: true,
      message: 'Gửi đánh giá thành công! Nhận xét của bạn đang chờ kiểm duyệt.',
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get reviews of a single product
// @route   GET /api/products/:productId/reviews
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      productId: req.params.productId,
      status: 'approved',
    })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all reviews (Staff / Admin)
// @route   GET /api/reviews
// @access  Private (Staff / Admin)
exports.getReviews = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.rating) {
      filter.rating = Number(req.query.rating);
    }

    const reviews = await Review.find(filter)
      .populate('userId', 'name email phone')
      .populate('productId', 'name code slug images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Approve/moderate review (Admin only)
// @route   PUT /api/reviews/:id/status
// @access  Private (Admin only)
exports.updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'hidden', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái kiểm duyệt không hợp lệ',
      });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá cần duyệt',
      });
    }

    review.status = status;
    await review.save(); // Save triggers average rating recalculation hook

    res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái kiểm duyệt thành: ${status}`,
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reply to customer review (Staff / Admin)
// @route   POST /api/reviews/:id/reply
// @access  Private (Staff / Admin)
exports.replyReview = async (req, res) => {
  try {
    const { reply } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá',
      });
    }

    review.reply = reply;
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Gửi phản hồi đánh giá thành công!',
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete review (Admin only)
// @route   DELETE /api/reviews/:id
// @access  Private (Admin only)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá cần xóa',
      });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate rating manually since review is deleted
    await Review.calculateAverageRating(productId);

    res.status(200).json({
      success: true,
      message: 'Xóa đánh giá thành công!',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
