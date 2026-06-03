const Product = require('../models/Product');
const Category = require('../models/Category');
const { bufferToBase64 } = require('../middlewares/uploadMiddleware');

// @desc    Get all products (public search, filter, sort, paginate)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const queryObj = {};

    // 1. Filtering for status (guests see active, admins see all)
    const isAdminOrStaff = req.user && (req.user.role === 'admin' || req.user.role === 'staff');
    if (!isAdminOrStaff) {
      queryObj.status = { $in: ['available', 'need_preorder', 'coming_soon'] };
    } else if (req.query.status) {
      queryObj.status = req.query.status;
    }

    // 2. Search by name, code or description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      queryObj.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { description: searchRegex }
      ];
    }

    // 3. Filter by category
    if (req.query.category) {
      // Check if category is objectId or slug
      let categoryId = req.query.category;
      if (!categoryId.match(/^[0-9a-fA-F]{24}$/)) {
        const cat = await Category.findOne({ slug: req.query.category });
        if (cat) {
          categoryId = cat._id;
        } else {
          // Send empty results if category slug not found
          return res.status(200).json({
            success: true,
            count: 0,
            totalPages: 0,
            currentPage: 1,
            products: [],
          });
        }
      }
      queryObj.categoryId = categoryId;
    }

    // 4. Filter by price range
    if (req.query.priceMin || req.query.priceMax) {
      queryObj.price = {};
      if (req.query.priceMin) queryObj.price.$gte = Number(req.query.priceMin);
      if (req.query.priceMax) queryObj.price.$lte = Number(req.query.priceMax);
    }

    // 5. Filter by flavor (array contains query value)
    if (req.query.flavor) {
      queryObj.flavor = { $in: Array.isArray(req.query.flavor) ? req.query.flavor : [req.query.flavor] };
    }

    // 6. Filter by size
    if (req.query.size) {
      queryObj.size = { $in: Array.isArray(req.query.size) ? req.query.size : [req.query.size] };
    }

    // 7. Filter by quick collections
    if (req.query.isFeatured) queryObj.isFeatured = req.query.isFeatured === 'true';
    if (req.query.isBestSeller) queryObj.isBestSeller = req.query.isBestSeller === 'true';
    if (req.query.isSeasonal) queryObj.isSeasonal = req.query.isSeasonal === 'true';

    // 8. Sorting
    let sortQuery = { createdAt: -1 }; // default newest
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price_asc':
          sortQuery = { price: 1 };
          break;
        case 'price_desc':
          sortQuery = { price: -1 };
          break;
        case 'newest':
          sortQuery = { createdAt: -1 };
          break;
        case 'rating':
          sortQuery = { ratingAverage: -1 };
          break;
        case 'bestseller':
          sortQuery = { isBestSeller: -1, createdAt: -1 };
          break;
      }
    }

    // 9. Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;

    const total = await Product.countDocuments(queryObj);
    const products = await Product.find(queryObj)
      .populate('categoryId', 'name slug')
      .sort(sortQuery)
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: products.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalProducts: total,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single product by id or slug
// @route   GET /api/products/:idOrSlug
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let query = {};

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug };
    }

    const product = await Product.findOne(query).populate('categoryId', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm bánh này',
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      code,
      categoryId,
      price,
      oldPrice,
      discountPrice,
      description,
      ingredients,
      flavor,
      size,
      weight,
      serving,
      stock,
      status,
      isFeatured,
      isBestSeller,
      isSeasonal,
    } = req.body;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục được chỉ định không tồn tại',
      });
    }

    // Generate product code if not provided
    const productCode = code || `SPB${Math.floor(100000 + Math.random() * 900000)}`;

    // Generate slug if not provided
    const productSlug = slug || name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const codeExists = await Product.findOne({ code: productCode });
    if (codeExists) {
      return res.status(400).json({
        success: false,
        message: 'Mã bánh này đã được đăng ký cho sản phẩm khác',
      });
    }

    const slugExists = await Product.findOne({ slug: productSlug });
    if (slugExists) {
      return res.status(400).json({
        success: false,
        message: 'Slug sản phẩm này đã tồn tại, vui lòng thay đổi tên hoặc cung cấp slug khác',
      });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => bufferToBase64(file));
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ít nhất một hình ảnh sản phẩm',
      });
    }

    // Parse array fields if they arrive as strings
    const parsedFlavor = typeof flavor === 'string' ? flavor.split(',').map(f => f.trim()) : flavor;
    const parsedSize = typeof size === 'string' ? size.split(',').map(s => s.trim()) : size;

    const product = await Product.create({
      name,
      slug: productSlug,
      code: productCode,
      categoryId,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : undefined,
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      images,
      description,
      ingredients,
      flavor: parsedFlavor,
      size: parsedSize,
      weight,
      serving,
      stock: Number(stock) || 0,
      status: status || 'available',
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isBestSeller: isBestSeller === 'true' || isBestSeller === true,
      isSeasonal: isSeasonal === 'true' || isSeasonal === true,
    });

    res.status(201).json({
      success: true,
      message: 'Thêm bánh mới thành công!',
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Lỗi thêm sản phẩm: ${error.message}`,
    });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      code,
      categoryId,
      price,
      oldPrice,
      discountPrice,
      description,
      ingredients,
      flavor,
      size,
      weight,
      serving,
      stock,
      status,
      isFeatured,
      isBestSeller,
      isSeasonal,
    } = req.body;

    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm cần cập nhật',
      });
    }

    // Check updates
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Danh mục được chỉ định không tồn tại',
        });
      }
      product.categoryId = categoryId;
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (ingredients !== undefined) product.ingredients = ingredients;
    if (weight !== undefined) product.weight = weight;
    if (serving !== undefined) product.serving = serving;
    if (price !== undefined) product.price = Number(price);
    if (oldPrice !== undefined) product.oldPrice = oldPrice ? Number(oldPrice) : undefined;
    if (discountPrice !== undefined) product.discountPrice = discountPrice ? Number(discountPrice) : undefined;
    if (stock !== undefined) product.stock = Number(stock);
    if (status) product.status = status;

    if (isFeatured !== undefined) product.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (isBestSeller !== undefined) product.isBestSeller = isBestSeller === 'true' || isBestSeller === true;
    if (isSeasonal !== undefined) product.isSeasonal = isSeasonal === 'true' || isSeasonal === true;

    if (code) {
      const codeExists = await Product.findOne({ code, _id: { $ne: req.params.id } });
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: 'Mã sản phẩm này đã được đăng ký cho bánh khác',
        });
      }
      product.code = code;
    }

    if (slug) {
      const slugExists = await Product.findOne({ slug, _id: { $ne: req.params.id } });
      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: 'Slug sản phẩm này đã bị trùng lặp',
        });
      }
      product.slug = slug;
    }

    // Process new images if uploaded
    if (req.files && req.files.length > 0) {
      product.images = req.files.map(file => bufferToBase64(file));
    } else if (req.body.images) {
      product.images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    // Process variations
    if (flavor) {
      product.flavor = typeof flavor === 'string' ? flavor.split(',').map(f => f.trim()) : flavor;
    }
    if (size) {
      product.size = typeof size === 'string' ? size.split(',').map(s => s.trim()) : size;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công!',
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Lỗi cập nhật: ${error.message}`,
    });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm cần xóa',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công!',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update product status
// @route   PUT /api/products/:id/status
// @access  Private (Admin/Staff)
exports.updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'out_of_stock', 'hidden', 'coming_soon', 'need_preorder'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái sản phẩm không hợp lệ',
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm bánh',
      });
    }

    product.status = status;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái sản phẩm thành công!',
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private (Admin only)
exports.uploadProductImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm bánh',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ít nhất một tệp hình ảnh để tải lên',
      });
    }

    const newImages = req.files.map(file => bufferToBase64(file));
    product.images = [...product.images, ...newImages];
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Tải lên hình ảnh sản phẩm thành công!',
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
