const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Contact = require('../models/Contact');
const CustomCakeRequest = require('../models/TeaBreakRequest');
const Promotion = require('../models/Promotion');

// @desc    Get stats for Staff Dashboard
// @route   GET /api/dashboard/staff
// @access  Private (Staff / Admin)
exports.getStaffStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Order status counts
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const preparingOrders = await Order.countDocuments({ orderStatus: 'preparing' });
    const shippingOrders = await Order.countDocuments({ orderStatus: 'shipping' });
    const completedToday = await Order.countDocuments({
      orderStatus: 'completed',
      updatedAt: { $gte: todayStart, $lte: todayEnd },
    });

    // 2. Custom cake request counts
    const pendingCustomCakes = await CustomCakeRequest.countDocuments({
      status: { $in: ['pending', 'received', 'consulting'] },
    });

    // 3. Customer contacts unhandled
    const newContacts = await Contact.countDocuments({ status: 'new' });

    // 4. Low stock alert (stock <= 5)
    const lowStockAlerts = await Product.countDocuments({
      stock: { $lte: 5 },
      status: { $ne: 'hidden' },
    });

    // 5. Total low stock products list
    const lowStockProducts = await Product.find({
      stock: { $lte: 5 },
      status: { $ne: 'hidden' },
    }).select('name code stock status');

    res.status(200).json({
      success: true,
      stats: {
        pendingOrders,
        preparingOrders,
        shippingOrders,
        completedToday,
        pendingCustomCakes,
        newContacts,
        lowStockAlerts,
      },
      lowStockProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get stats for Admin Dashboard
// @route   GET /api/dashboard/admin
// @access  Private (Admin only)
exports.getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // 1. Total counts
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'available' });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });
    const totalCategories = await Category.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const totalStaff = await User.countDocuments({ role: 'staff' });
    const totalOrders = await Order.countDocuments();

    // 2. Order breakdown
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const preparingOrders = await Order.countDocuments({ orderStatus: 'preparing' });
    const completedOrders = await Order.countDocuments({ orderStatus: 'completed' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'cancelled' });

    // 3. Revenue calculations
    const todayRevenueObj = await Order.aggregate([
      {
        $match: {
          orderStatus: 'completed',
          updatedAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$finalAmount' },
        },
      },
    ]);
    const todayRevenue = todayRevenueObj[0]?.total || 0;

    const thisMonthRevenueObj = await Order.aggregate([
      {
        $match: {
          orderStatus: 'completed',
          updatedAt: { $gte: thisMonthStart },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$finalAmount' },
        },
      },
    ]);
    const thisMonthRevenue = thisMonthRevenueObj[0]?.total || 0;

    // 4. Best selling products (sum of quantities from completed orders)
    const bestSellers = await Order.aggregate([
      { $match: { orderStatus: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          soldQuantity: { $sum: '$items.quantity' },
          totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { soldQuantity: -1 } },
      { $limit: 5 },
    ]);

    // 5. Active custom cake requests count
    const totalCustomCakes = await CustomCakeRequest.countDocuments();

    // 6. Active promotion coupon count
    const totalPromotions = await Promotion.countDocuments({ status: 'active' });

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        outOfStockProducts,
        totalCategories,
        totalCustomers,
        totalStaff,
        totalOrders,
        pendingOrders,
        preparingOrders,
        completedOrders,
        cancelledOrders,
        todayRevenue,
        thisMonthRevenue,
        totalCustomCakes,
        totalPromotions,
      },
      bestSellers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get revenue report for chart drawing
// @route   GET /api/dashboard/revenue-report
// @access  Private (Admin only)
exports.getRevenueReport = async (req, res) => {
  try {
    const range = req.query.range || '7days';
    const now = new Date();
    let startDate = new Date();

    if (range === '7days') {
      startDate.setDate(now.getDate() - 7);
    } else if (range === '30days') {
      startDate.setDate(now.getDate() - 30);
    } else if (range === 'thismonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === 'thisyear') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    startDate.setHours(0, 0, 0, 0);

    const report = await Order.aggregate([
      {
        $match: {
          orderStatus: 'completed',
          updatedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$updatedAt', timezone: '+07:00' },
          },
          revenue: { $sum: '$finalAmount' },
          ordersCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Format output
    const labels = report.map(item => {
      const parts = item._id.split('-');
      return `${parts[2]}/${parts[1]}`; // dd/mm format
    });
    const values = report.map(item => item.revenue);
    const orderCounts = report.map(item => item.ordersCount);

    res.status(200).json({
      success: true,
      report: {
        labels,
        values,
        orderCounts,
        raw: report,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
