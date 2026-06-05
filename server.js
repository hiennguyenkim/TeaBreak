const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Custom Security Middlewares
const {
  preventNoSqlInjection,
  preventXss,
  csrfGuard,
  rateLimiter,
} = require('./middlewares/securityMiddleware');

app.use(preventNoSqlInjection);
app.use(preventXss);
app.use(csrfGuard);
app.use(rateLimiter);

// Static folders
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve main view page statically if requested direct from public (optional fallback)
app.use(express.static(path.join(__dirname, 'public')));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const contactRoutes = require('./routes/contactRoutes');
const customCakeRoutes = require('./routes/teaBreakRoutes'); // Maintain alias name to avoid breaking file imports
const teaBreakRoutes = require('./routes/teaBreakRoutes');
const messageRoutes = require('./routes/messageRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingRoutes = require('./routes/settingRoutes');
const viewRoutes = require('./routes/viewRoutes');

const { protect } = require('./middlewares/authMiddleware');
const { restrictTo } = require('./middlewares/roleMiddleware');
const User = require('./models/User');

app.get('/api/staff/customers/search', protect, restrictTo('staff', 'admin'), async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q) {
      return res.status(200).json({ success: true, customers: [] });
    }
    const searchRegex = new RegExp(q, 'i');
    const customers = await User.find({
      role: 'user',
      $or: [
        { name: searchRegex },
        { phone: searchRegex }
      ]
    }).limit(10);
    
    res.status(200).json({
      success: true,
      customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/custom-cakes', customCakeRoutes); // compatibility alias
app.use('/api/teabreak-requests', teaBreakRoutes);
app.use('/api/tea-break-orders', teaBreakRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingRoutes);

// Mount View Routes (Serves the HTML pages)
app.use('/', viewRoutes);

// Database Seeder function
const seedDatabase = async () => {
  try {
    const User = require('./models/User');
    const Category = require('./models/Category');
    const Product = require('./models/Product');
    const Promotion = require('./models/Promotion');

    // 1. Seed users if empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding default users...');
      // Admin
      await User.create({
        name: 'Quản trị viên Pinky',
        email: 'admin@gmail.com',
        password: 'admin123',
        phone: '0988888888',
        address: '88 Đường Hoa Hồng, Quận 1, TP. HCM',
        role: 'admin',
        status: 'active',
      });
      // Staff
      await User.create({
        name: 'Nhân viên Mai Anh',
        email: 'staff@gmail.com',
        password: 'staff123',
        phone: '0977777777',
        address: '77 Đường Kẹo Ngọt, Quận 3, TP. HCM',
        role: 'staff',
        status: 'active',
      });
      // Customer
      await User.create({
        name: 'Khách hàng Minh Trí',
        email: 'user@gmail.com',
        password: 'user123',
        phone: '0966666666',
        address: '66 Đường Bánh Bông Lan, Bình Thạnh, TP. HCM',
        role: 'user',
        status: 'active',
      });
      console.log('Default users seeded successfully (admin@gmail.com/admin123, staff@gmail.com/staff123, user@gmail.com/user123)');
    }

    // 2. Seed categories if empty
    const categoryCount = await Category.countDocuments();
    let seededCategories = [];
    if (categoryCount === 0) {
      console.log('Seeding default categories...');
      seededCategories = await Category.create([
        {
          name: 'Mini Cake nhỏ xinh',
          slug: 'mini-cake',
          image: '/public/img/cat-mousse.jpg',
          description: 'Các mẫu bánh mini mousse, mini tiramisu nhỏ xinh tinh tế cho tiệc trà.',
          status: 'active',
          sortOrder: 1,
        },
        {
          name: 'Tea Break Packages',
          slug: 'tea-break-packages',
          image: '/public/img/cat-wedding.jpg',
          description: 'Set tiệc trà trọn gói kèm đồ uống và bánh ngọt/mặn phục vụ sự kiện.',
          status: 'active',
          sortOrder: 2,
        },
        {
          name: 'Corporate Orders',
          slug: 'corporate-orders',
          image: '/public/img/cat-birthday.jpg',
          description: 'Đặt tiệc trà số lượng lớn dành cho văn phòng, hội nghị, khai trương doanh nghiệp.',
          status: 'active',
          sortOrder: 3,
        },
        {
          name: 'Bánh su kem ngọt ngào',
          slug: 'banh-su-kem',
          image: '/public/img/cat-su-kem.jpg',
          description: 'Su kem giòn vỏ, ngập tràn nhân kem vani thanh mát.',
          status: 'active',
          sortOrder: 4,
        },
      ]);
      console.log('Categories seeded.');
    } else {
      seededCategories = await Category.find();
    }

    // 3. Seed products if empty
    const productCount = await Product.countDocuments();
    if (productCount === 0 && seededCategories.length > 0) {
      console.log('Seeding default products...');
      const catMini = seededCategories.find(c => c.slug === 'mini-cake') || seededCategories[0];
      const catPackages = seededCategories.find(c => c.slug === 'tea-break-packages') || seededCategories[0];
      const catCorporate = seededCategories.find(c => c.slug === 'corporate-orders') || seededCategories[0];

      await Product.create([
        {
          name: 'Mini Mousse Dâu Tây Hộp 4 Cái',
          slug: 'mini-mousse-dau-tay-hop-4-cai',
          code: 'MST01',
          categoryId: catMini._id,
          price: 320000,
          oldPrice: 380000,
          images: ['/public/img/product-strawberry-mousse.jpg'],
          description: 'Cốt bánh mềm mịn, ngập tràn kem tươi phô mai dâu tây nhập khẩu Pháp. Bánh thơm lừng dâu tây Đà Lạt tươi mát ngọt ngào.',
          ingredients: 'Dâu tây tươi Đà Lạt, Cream cheese Pháp, Gelatin, Bột mì, Đường cát',
          flavor: ['Dâu tây', 'Phô mai'],
          size: ['16cm', '20cm'],
          weight: '500g',
          serving: '3-5 người',
          stock: 15,
          status: 'available',
          isFeatured: true,
          isBestSeller: true,
          ratingAverage: 4.9,
          reviewCount: 0,
        },
        {
          name: 'Set Tea Break Tiệc Trà Standard (Package B)',
          slug: 'set-tea-break-standard',
          code: 'BKM01',
          categoryId: catPackages._id,
          price: 290000,
          images: ['/public/img/product-matcha-cake.jpg'],
          description: 'Set tiệc trà Tea Break nhỏ xinh cho 5-8 người bao gồm 10 bánh ngọt mini và 1 bình trà Earl Grey.',
          ingredients: 'Bột trà Earl Grey nhập khẩu Anh, Bánh ngọt tổng hợp, Trứng gà sạch',
          flavor: ['Earl Grey', 'Vani'],
          size: ['Set 5-8 người', 'Set 10-15 người'],
          weight: '600g',
          serving: '4-6 người',
          stock: 10,
          status: 'available',
          isFeatured: true,
          isBestSeller: false,
          ratingAverage: 4.7,
          reviewCount: 0,
        },
        {
          name: 'Set Tea Break Tiệc Trà Hoàng Gia (Package A)',
          slug: 'set-tea-break-hoang-gia',
          code: 'TIR01',
          categoryId: catPackages._id,
          price: 350000,
          oldPrice: 420000,
          images: ['/public/img/product-tiramisu.jpg'],
          description: 'Set tiệc trà Tea Break cao cấp dành cho 10-15 người bao gồm 15 bánh ngọt mini, 10 bánh mặn finger-sandwich và 1 bình trà ô long cam đào.',
          ingredients: 'Trà ô long thượng hạng, Cam tươi, Bánh mặn ngọt tổng hợp',
          flavor: ['Trà ô long', 'Cam đào'],
          size: ['Set 10-15 người', 'Set 20-30 người'],
          weight: '650g',
          serving: '4-7 người',
          stock: 8,
          status: 'available',
          isFeatured: true,
          isBestSeller: true,
          ratingAverage: 4.8,
          reviewCount: 0,
        },
        {
          name: 'Hộp Mini Cupcake Thập Cẩm 12 Cái',
          slug: 'hop-mini-cupcake-thap-cam-12-cai',
          code: 'CUP01',
          categoryId: catMini._id,
          price: 180000,
          images: ['/public/img/product-cupcake.jpg'],
          description: 'Bộ sưu tập 12 chiếc cupcake mini ngộ nghĩnh nhiều màu sắc và hương vị khác nhau (Socola, vani, dâu tây, việt quất...). Thích hợp cho tiệc nhỏ sinh nhật hoặc họp mặt trà chiều.',
          ingredients: 'Bơ nhạt Anchor, Sữa tươi tiệt trùng, Hương vị trái cây tự nhiên',
          flavor: ['Vani', 'Dâu tây', 'Socola', 'Việt quất'],
          size: ['Hộp 12 cái'],
          weight: '300g',
          serving: '1-3 người',
          stock: 20,
          status: 'available',
          isFeatured: false,
          isBestSeller: true,
          ratingAverage: 4.6,
          reviewCount: 0,
        },
      ]);
      console.log('Products seeded.');
    }

    // 4. Seed promotions if empty
    const promoCount = await Promotion.countDocuments();
    if (promoCount === 0) {
      console.log('Seeding default promotions...');
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      await Promotion.create([
        {
          code: 'PINKY10',
          name: 'Chào Mừng Tiệm Bánh Mới - Giảm 10%',
          discountType: 'percentage',
          discountValue: 10,
          minOrderAmount: 100000,
          usageLimit: 100,
          usedCount: 0,
          startDate: new Date(),
          expiryDate: nextMonth,
          status: 'active',
        },
        {
          code: 'SWEET50K',
          name: 'Ngày Hội Ngọt Ngào - Giảm 50.000đ',
          discountType: 'fixed',
          discountValue: 50000,
          minOrderAmount: 300000,
          usageLimit: 50,
          usedCount: 0,
          startDate: new Date(),
          expiryDate: nextMonth,
          status: 'active',
        },
      ]);
      console.log('Promotions seeded.');
    }
  } catch (error) {
    console.error(`Failed to seed database: ${error.message}`);
  }
};

// Seed db once connected
setTimeout(seedDatabase, 3000);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: `Lỗi hệ thống: ${err.message}`,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n================================================================`);
  console.log(`  🚀 SWEET PINK BAKERY & TEA BREAK SERVER RUNNING`);
  console.log(`  🔗 Local URL: http://localhost:${PORT}`);
  console.log(`================================================================`);
  console.log(`  👤 TÀI KHOẢN KHÁCH HÀNG (CUSTOMER):`);
  console.log(`     Email: user@gmail.com | Password: user123`);
  console.log(`  --------------------------------------------------------------`);
  console.log(`  🧑‍🍳 TÀI KHOẢN NHÂN VIÊN (STAFF):`);
  console.log(`     Email: staff@gmail.com | Password: staff123`);
  console.log(`  --------------------------------------------------------------`);
  console.log(`  👑 TÀI KHOẢN QUẢN TRỊ VIÊN (ADMIN):`);
  console.log(`     Email: admin@gmail.com | Password: admin123`);
  console.log(`================================================================\n`);
});
