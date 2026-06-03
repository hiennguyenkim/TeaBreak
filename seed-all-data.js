const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config();

const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Promotion = require('./models/Promotion');
const Order = require('./models/Order');
const Contact = require('./models/Contact');
const Message = require('./models/Message');
const TeaBreakRequest = require('./models/TeaBreakRequest');
const Review = require('./models/Review');
const Setting = require('./models/Setting');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sweet-pink-bakery';

console.log('Connecting to database at:', mongoUri);

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB. Wiping existing data...');
    
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Promotion.deleteMany({});
    await Order.deleteMany({});
    await Contact.deleteMany({});
    await Message.deleteMany({});
    await TeaBreakRequest.deleteMany({});
    await Review.deleteMany({});
    await Setting.deleteMany({});
    
    console.log('Wiped all collections.');

    // 1. Seed Users
    console.log('Seeding Users...');
    const admin = await User.create({
      name: 'Quản trị viên Pinky',
      email: 'admin@gmail.com',
      password: 'admin123',
      phone: '0988888888',
      address: '88 Đường Hoa Hồng, Quận 1, TP. HCM',
      role: 'admin',
      status: 'active',
    });

    const staff = await User.create({
      name: 'Nhân viên Mai Anh',
      email: 'staff@gmail.com',
      password: 'staff123',
      phone: '0977777777',
      address: '77 Đường Kẹo Ngọt, Quận 3, TP. HCM',
      role: 'staff',
      status: 'active',
    });

    const customer = await User.create({
      name: 'Khách hàng Minh Trí',
      email: 'user@gmail.com',
      password: 'user123',
      phone: '0966666666',
      address: '66 Đường Bánh Bông Lan, Bình Thạnh, TP. HCM',
      role: 'user',
      status: 'active',
    });

    const customer2 = await User.create({
      name: 'Khách hàng Hoàng Nam',
      email: 'namhoang@gmail.com',
      password: 'user123',
      phone: '0955555555',
      address: '12 Đường Lê Lợi, Quận 1, TP. HCM',
      role: 'user',
      status: 'active',
    });

    const customer3 = await User.create({
      name: 'Khách hàng Thu Trang',
      email: 'trangthu@gmail.com',
      password: 'user123',
      phone: '0944444444',
      address: '45 Đường Điện Biên Phủ, Bình Thạnh, TP. HCM',
      role: 'user',
      status: 'active',
    });

    console.log('Seeded Users successfully.');

    // 2. Seed Categories
    console.log('Seeding Categories...');
    const categories = await Category.create([
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
    console.log('Seeded Categories successfully.');

    const catMini = categories.find(c => c.slug === 'mini-cake');
    const catPackages = categories.find(c => c.slug === 'tea-break-packages');
    const catCorp = categories.find(c => c.slug === 'corporate-orders');
    const catSu = categories.find(c => c.slug === 'banh-su-kem');

    // 3. Seed Products
    console.log('Seeding Products...');
    const products = await Product.create([
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
        size: ['Hộp 4 cái'],
        weight: '500g',
        serving: '3-5 người',
        stock: 15,
        status: 'available',
        isFeatured: true,
        isBestSeller: true,
        ratingAverage: 4.9,
        reviewCount: 1,
      },
      {
        name: 'Mini Tiramisu Cacao Hộp 4 Cái',
        slug: 'mini-tiramisu-cacao-hop-4-cai',
        code: 'MST02',
        categoryId: catMini._id,
        price: 300000,
        images: ['/public/img/product-tiramisu.jpg'],
        description: 'Bánh kem lạnh vị cà phê và cacao phô mai Mascarpone béo ngậy hảo hạng.',
        ingredients: 'Mascarpone Ý, Cà phê Robusta, Trứng gà, Cacao nguyên chất Bỉ',
        flavor: ['Cà phê', 'Mascarpone'],
        size: ['Hộp 4 cái'],
        weight: '480g',
        serving: '3-4 người',
        stock: 12,
        status: 'available',
        isFeatured: true,
        isBestSeller: true,
        ratingAverage: 4.8,
        reviewCount: 0,
      },
      {
        name: 'Mini Red Velvet Kem Phô Mai Hộp 4 Cái',
        slug: 'mini-red-velvet-hop-4-cai',
        code: 'MST03',
        categoryId: catMini._id,
        price: 340000,
        images: ['/public/img/product-red-velvet.jpg'],
        description: 'Cốt bánh đỏ nhung mịn kết hợp với lớp kem phô mai chua dịu ngọt ngào.',
        ingredients: 'Bột cacao, Màu thực phẩm đỏ organic, Cream cheese, Bơ lạt Anchor',
        flavor: ['Vani phô mai', 'Cacao'],
        size: ['Hộp 4 cái'],
        weight: '500g',
        serving: '3-5 người',
        stock: 8,
        status: 'available',
        isFeatured: false,
        isBestSeller: false,
        ratingAverage: 4.7,
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
        size: ['Set 5-8 người'],
        weight: '600g',
        serving: '5-8 người',
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
        size: ['Set 10-15 người'],
        weight: '650g',
        serving: '10-15 người',
        stock: 8,
        status: 'available',
        isFeatured: true,
        isBestSeller: true,
        ratingAverage: 4.8,
        reviewCount: 0,
      },
      {
        name: 'Set Tea Break Kem Trái Cây Cao Cấp',
        slug: 'set-tea-break-kem-trai-cay',
        code: 'BKM02',
        categoryId: catPackages._id,
        price: 380000,
        images: ['/public/img/product-fruit-cake.jpg'],
        description: 'Sự kết hợp hoàn hảo giữa các loại bánh tart trái cây tươi và trà hoa quả thanh mát ngọt lành.',
        ingredients: 'Bánh Tart trái cây, Kiwi, Dâu tây, Trà hoa quả nhiệt đới',
        flavor: ['Trái cây nhiệt đới'],
        size: ['Set 5-8 người'],
        weight: '700g',
        serving: '5-8 người',
        stock: 6,
        status: 'available',
        isFeatured: false,
        isBestSeller: false,
        ratingAverage: 4.6,
        reviewCount: 0,
      },
      {
        name: 'Gói Tiệc Trà Văn Phòng VIP 20-30 Khách',
        slug: 'goi-tiec-tra-van-phong-vip',
        code: 'CORP01',
        categoryId: catCorp._id,
        price: 1500000,
        images: ['/public/img/product-matcha-cake.jpg'],
        description: 'Set tiệc trà văn phòng cao cấp cho 20-30 người ăn, đi kèm khay bày trí inox sang trọng và trà nóng phục vụ tận nơi.',
        ingredients: 'Bánh mặn Canape, Croissant mini, Mousse ly nhỏ, Trà đào sả',
        flavor: ['Hỗn hợp ngọt mặn'],
        size: ['Set 20-30 người'],
        weight: '2500g',
        serving: '20-30 người',
        stock: 5,
        status: 'available',
        isFeatured: true,
        isBestSeller: true,
        ratingAverage: 4.9,
        reviewCount: 0,
      },
      {
        name: 'Gói Khai Trương Sự Kiện Standard 50 Khách',
        slug: 'goi-khai-truong-standard-50-khach',
        code: 'CORP02',
        categoryId: catCorp._id,
        price: 2800000,
        images: ['/public/img/product-matcha-cake.jpg'],
        description: 'Gói tiệc ngọt khai trương công ty, sự kiện lớn cho 50 người, đầy đủ bánh ngọt mặn phong phú và đồ uống nước ép hoa quả.',
        ingredients: 'Bánh teabreak tổng hợp, Trái cây xiên, Trà chanh dây mật ong',
        flavor: ['Tổng hợp ngọt mặn'],
        size: ['Set 50 người'],
        weight: '5000g',
        serving: '50 người',
        stock: 3,
        status: 'available',
        isFeatured: false,
        isBestSeller: false,
        ratingAverage: 4.5,
        reviewCount: 0,
      },
      {
        name: 'Hộp Bánh Su Kem Vani Anchor 10 Cái',
        slug: 'hop-banh-su-kem-vani-anchor-10-cai',
        code: 'SU01',
        categoryId: catSu._id,
        price: 90000,
        images: ['/public/img/product-strawberry-mousse.jpg'],
        description: 'Bánh su kem vỏ giòn choux kem ngập nhân kem sữa tươi Anchor béo ngậy mát lạnh.',
        ingredients: 'Bột mì, Bơ lạt Anchor, Whipping cream, Hương vani tự nhiên',
        flavor: ['Kem vani Anchor'],
        size: ['Hộp 10 cái'],
        weight: '200g',
        serving: '2-3 người',
        stock: 30,
        status: 'available',
        isFeatured: true,
        isBestSeller: true,
        ratingAverage: 4.8,
        reviewCount: 0,
      },
      {
        name: 'Hộp Bánh Su Kem Trà Xanh Uji Nhật Bản',
        slug: 'hop-banh-su-kem-tra-xanh-uji-10-cai',
        code: 'SU02',
        categoryId: catSu._id,
        price: 110000,
        images: ['/public/img/product-matcha-cake.jpg'],
        description: 'Kem tươi Anchor kết hợp bột trà xanh Uji thượng hạng nhập khẩu Nhật Bản thơm mát thanh nhẹ.',
        ingredients: 'Bột trà xanh Uji Nhật Bản, Whipping cream Pháp, Đường lạt',
        flavor: ['Trà xanh phô mai'],
        size: ['Hộp 10 cái'],
        weight: '200g',
        serving: '2-3 người',
        stock: 25,
        status: 'available',
        isFeatured: false,
        isBestSeller: true,
        ratingAverage: 4.7,
        reviewCount: 0,
      },
      {
        name: 'Set Su Kem Thiên Đường Phủ Socola Bỉ',
        slug: 'set-su-kem-socola-bi-10-cai',
        code: 'SU03',
        categoryId: catSu._id,
        price: 130000,
        images: ['/public/img/product-tiramisu.jpg'],
        description: 'Vỏ bánh su kem phủ socola đen Bỉ nguyên chất đắng ngọt tinh tế cùng nhân kem sữa phô mai.',
        ingredients: 'Socola Bỉ 65%, Kem tươi phô mai, Trứng gà sạch',
        flavor: ['Socola', 'Kem sữa'],
        size: ['Hộp 10 cái'],
        weight: '220g',
        serving: '2-3 người',
        stock: 20,
        status: 'available',
        isFeatured: true,
        isBestSeller: false,
        ratingAverage: 4.9,
        reviewCount: 0,
      },
    ]);
    console.log('Seeded Products successfully.');

    // 4. Seed Promotions
    console.log('Seeding Promotions...');
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
        usedCount: 5,
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
        usedCount: 2,
        startDate: new Date(),
        expiryDate: nextMonth,
        status: 'active',
      },
    ]);
    console.log('Seeded Promotions successfully.');

    // 5. Seed Orders (Historical for charts & stats)
    console.log('Seeding Orders...');
    const getPastDate = (daysAgo) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d;
    };

    const pMousse = products.find(p => p.code === 'MST01');
    const pTira = products.find(p => p.code === 'MST02');
    const pSuVani = products.find(p => p.code === 'SU01');
    const pCorpVIP = products.find(p => p.code === 'CORP01');

    const orders = await Order.create([
      {
        orderCode: 'SPB900001',
        userId: customer._id,
        fullname: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        items: [
          {
            productId: pMousse._id,
            name: pMousse.name,
            price: pMousse.price,
            quantity: 2,
            size: 'Hộp 4 cái',
            flavor: 'Dâu tây',
          }
        ],
        totalAmount: 640000,
        discountAmount: 64000,
        finalAmount: 576000,
        paymentMethod: 'bank_transfer',
        paymentStatus: 'paid',
        orderStatus: 'completed',
        deliveryDate: getPastDate(6),
        deliveryTime: '10:00 - 12:00',
        createdAt: getPastDate(6),
      },
      {
        orderCode: 'SPB900002',
        userId: customer2._id,
        fullname: customer2.name,
        phone: customer2.phone,
        email: customer2.email,
        address: customer2.address,
        items: [
          {
            productId: pTira._id,
            name: pTira.name,
            price: pTira.price,
            quantity: 1,
            size: 'Hộp 4 cái',
            flavor: 'Cà phê',
          }
        ],
        totalAmount: 300000,
        discountAmount: 0,
        finalAmount: 300000,
        paymentMethod: 'cod',
        paymentStatus: 'paid',
        orderStatus: 'completed',
        deliveryDate: getPastDate(5),
        deliveryTime: '14:00 - 16:00',
        createdAt: getPastDate(5),
      },
      {
        orderCode: 'SPB900003',
        userId: customer3._id,
        fullname: customer3.name,
        phone: customer3.phone,
        email: customer3.email,
        address: customer3.address,
        items: [
          {
            productId: pSuVani._id,
            name: pSuVani.name,
            price: pSuVani.price,
            quantity: 2,
            size: 'Hộp 10 cái',
            flavor: 'Kem vani Anchor',
          }
        ],
        totalAmount: 180000,
        discountAmount: 0,
        finalAmount: 180000,
        paymentMethod: 'e_wallet',
        paymentStatus: 'failed',
        orderStatus: 'cancelled',
        deliveryDate: getPastDate(4),
        deliveryTime: '16:00 - 18:00',
        createdAt: getPastDate(4),
      },
      {
        orderCode: 'SPB900004',
        userId: customer._id,
        fullname: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        items: [
          {
            productId: pCorpVIP._id,
            name: pCorpVIP.name,
            price: pCorpVIP.price,
            quantity: 1,
            size: 'Set 20-30 người',
            flavor: 'Hỗn hợp ngọt mặn',
          }
        ],
        totalAmount: 1500000,
        discountAmount: 50000,
        finalAmount: 1450000,
        paymentMethod: 'bank_transfer',
        paymentStatus: 'paid',
        orderStatus: 'completed',
        deliveryDate: getPastDate(3),
        deliveryTime: '10:00 - 12:00',
        createdAt: getPastDate(3),
      },
      {
        orderCode: 'SPB900005',
        userId: customer2._id,
        fullname: customer2.name,
        phone: customer2.phone,
        email: customer2.email,
        address: customer2.address,
        items: [
          {
            productId: pSuVani._id,
            name: pSuVani.name,
            price: pSuVani.price,
            quantity: 1,
            size: 'Hộp 10 cái',
            flavor: 'Kem vani Anchor',
          }
        ],
        totalAmount: 90000,
        discountAmount: 0,
        finalAmount: 90000,
        paymentMethod: 'cod',
        paymentStatus: 'paid',
        orderStatus: 'completed',
        deliveryDate: getPastDate(2),
        deliveryTime: '12:00 - 14:00',
        createdAt: getPastDate(2),
      },
      {
        orderCode: 'SPB900006',
        userId: customer3._id,
        fullname: customer3.name,
        phone: customer3.phone,
        email: customer3.email,
        address: customer3.address,
        items: [
          {
            productId: pMousse._id,
            name: pMousse.name,
            price: pMousse.price,
            quantity: 1,
            size: 'Hộp 4 cái',
            flavor: 'Dâu tây',
          },
          {
            productId: pSuVani._id,
            name: pSuVani.name,
            price: pSuVani.price,
            quantity: 1,
            size: 'Hộp 10 cái',
            flavor: 'Kem vani Anchor',
          }
        ],
        totalAmount: 410000,
        discountAmount: 41000,
        finalAmount: 369000,
        paymentMethod: 'bank_transfer',
        paymentStatus: 'paid',
        orderStatus: 'shipping',
        deliveryDate: getPastDate(1),
        deliveryTime: '16:00 - 18:00',
        createdAt: getPastDate(1),
      },
      {
        orderCode: 'SPB900007',
        userId: customer._id,
        fullname: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        items: [
          {
            productId: pTira._id,
            name: pTira.name,
            price: pTira.price,
            quantity: 1,
            size: 'Hộp 4 cái',
            flavor: 'Cà phê',
          }
        ],
        totalAmount: 300000,
        discountAmount: 30000,
        finalAmount: 270000,
        paymentMethod: 'e_wallet',
        paymentStatus: 'paid',
        orderStatus: 'preparing',
        deliveryDate: new Date(),
        deliveryTime: '18:00 - 20:00',
        createdAt: new Date(),
      },
      {
        orderCode: 'SPB900008',
        userId: customer2._id,
        fullname: customer2.name,
        phone: customer2.phone,
        email: customer2.email,
        address: customer2.address,
        items: [
          {
            productId: pSuVani._id,
            name: pSuVani.name,
            price: pSuVani.price,
            quantity: 2,
            size: 'Hộp 10 cái',
            flavor: 'Kem vani Anchor',
          }
        ],
        totalAmount: 180000,
        discountAmount: 0,
        finalAmount: 180000,
        paymentMethod: 'cod',
        paymentStatus: 'unpaid',
        orderStatus: 'pending',
        deliveryDate: new Date(),
        deliveryTime: '10:00 - 12:00',
        createdAt: new Date(),
      }
    ]);
    console.log('Seeded Orders successfully.');

    // 6. Seed TeaBreakRequests
    console.log('Seeding TeaBreakRequests...');
    await TeaBreakRequest.create([
      {
        userId: customer._id,
        fullname: customer.name,
        phone: customer.phone,
        email: customer.email,
        packageType: 'Set tiệc ngọt',
        groupSize: '20-30 người',
        teaOption: 'Trà Ô long',
        corporateName: 'Công ty Công nghệ Việt',
        eventTheme: 'Tông xanh dương thanh lịch',
        sampleLayout: '/public/img/teabreak-layout-1.jpg',
        expectedDate: getPastDate(-1),
        expectedTime: '14:00 - 16:00',
        note: 'Cần setup trước 30 phút, chuẩn bị khay dĩa sạch đẹp.',
        status: 'pending',
      },
      {
        userId: customer2._id,
        fullname: customer2.name,
        phone: customer2.phone,
        email: customer2.email,
        packageType: 'Set tiệc mặn',
        groupSize: '10-15 người',
        teaOption: 'Trà Earl Grey',
        corporateName: 'Văn phòng Luật Đại Việt',
        eventTheme: 'Ấm cúng nhẹ nhàng',
        sampleLayout: '/public/img/teabreak-layout-2.jpg',
        expectedDate: getPastDate(-2),
        expectedTime: '09:30 - 11:00',
        note: 'Lấy thêm nhiều croissant mini.',
        quotedPrice: 1200000,
        status: 'quoted',
      },
      {
        userId: customer3._id,
        fullname: customer3.name,
        phone: customer3.phone,
        email: customer3.email,
        packageType: 'Set kết hợp',
        groupSize: '50+ người',
        teaOption: 'Trà hoa cúc',
        corporateName: 'Ngân hàng Thịnh Vượng',
        eventTheme: 'Tông màu vàng rực rỡ',
        sampleLayout: '/public/img/teabreak-layout-3.jpg',
        expectedDate: getPastDate(-3),
        expectedTime: '15:00 - 17:00',
        note: 'Tiệc khai trương chi nhánh mới, cần bày khay sang trọng.',
        quotedPrice: 3800000,
        status: 'confirmed',
      }
    ]);
    console.log('Seeded TeaBreakRequests successfully.');

    // 7. Seed Contacts
    console.log('Seeding Contacts...');
    await Contact.create([
      {
        name: 'Nguyễn Văn Hùng',
        email: 'hungnguyen@gmail.com',
        phone: '0912123456',
        subject: 'Yêu cầu hóa đơn đỏ VAT',
        content: 'Chào tiệm bánh, đơn hàng #SPB900004 của công ty chúng tôi cần xuất hóa đơn đỏ. Vui lòng liên hệ hướng dẫn gửi thông tin.',
        orderCode: 'SPB900004',
        status: 'new',
      },
      {
        name: 'Trần Thị Thuỷ',
        email: 'thuytran@gmail.com',
        phone: '0983777888',
        subject: 'Tư vấn thực đơn tiệc ngọt',
        content: 'Tôi muốn đặt tiệc ngọt cho khoảng 80 người ăn, xin thực đơn chi tiết và báo giá tốt nhất.',
        status: 'processing',
        staffReply: 'Chào chị Thủy, tiệm đã nhận được thông tin và đang lên báo giá chi tiết gửi qua email cho chị ạ.',
      },
      {
        name: 'Lê Minh Quân',
        email: 'quanle@gmail.com',
        phone: '0909999888',
        subject: 'Khen ngợi dịch vụ',
        content: 'Gói tiệc trà chiều giao rất đúng giờ, bánh ngon sạch sẽ, nhân viên setup thân thiện. Nhất định sẽ ủng hộ tiệm lần sau.',
        status: 'done',
        staffReply: 'Dạ tiệm bánh Sweet Pink rất cảm ơn anh Quân đã ủng hộ và dành lời khen quý báu ạ!',
      }
    ]);
    console.log('Seeding Contacts successfully.');

    // 8. Seed Messages
    console.log('Seeding Messages...');
    await Message.create([
      {
        senderId: customer._id,
        receiverId: admin._id,
        content: 'Chào tiệm bánh, mình muốn tư vấn thực đơn cho tiệc sinh nhật công ty.',
        isRead: true,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        senderId: admin._id,
        receiverId: customer._id,
        content: 'Chào bạn, tiệm bánh sẵn sàng hỗ trợ bạn ạ. Bạn dự kiến tổ chức cho khoảng bao nhiêu người ăn và có yêu cầu đặc biệt nào không?',
        isRead: true,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        senderId: customer._id,
        receiverId: admin._id,
        content: 'Dạ tầm 25 người, mình muốn có cả bánh su kem và trà túi lọc Earl Grey.',
        isRead: true,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        senderId: admin._id,
        receiverId: customer._id,
        content: 'Dạ với 25 người bạn có thể chọn Set Tea Break Standard kết hợp thêm hộp su kem Anchor nhé ạ.',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      }
    ]);
    console.log('Seeded Messages successfully.');

    // 9. Seed Review
    console.log('Seeding Reviews...');
    await Review.create({
      productId: pMousse._id,
      userId: customer._id,
      orderId: orders[0]._id,
      rating: 5,
      content: 'Bánh ngon, vị ngọt chua của dâu rất thanh không bị ngấy, đóng gói đẹp đúng giờ!',
      status: 'approved',
    });
    console.log('Seeded Reviews successfully.');

    // 10. Seed Settings
    console.log('Seeding Settings...');
    await Setting.create({
      logoText: 'Sweet Pink Bakery & Tea Break',
      logoIcon: '🍰',
      footerDesc: 'Cung cấp dịch vụ tiệc ngọt hội nghị, khai trương, tiệc trà chiều doanh nghiệp và các dòng mini cake tinh tế hàng đầu.',
      socialFb: 'https://facebook.com',
      socialInsta: 'https://instagram.com',
      socialYoutube: 'https://youtube.com',
      address: '123 Đường Hồng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      phone: '0988.888.888',
      email: 'support@sweetpinkbakery.vn',
      openingHours: 'Mở cửa từ 07:30 - 21:00 hàng ngày (Cả ngày lễ)',
    });
    console.log('Seeded Settings successfully.');

    console.log('\n======================================================');
    console.log('🎯 COMPREHENSIVE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to seed comprehensive database:', err);
    process.exit(1);
  });
