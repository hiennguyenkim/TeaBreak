const Category = require('../models/Category');
const { bufferToBase64 } = require('../middlewares/uploadMiddleware');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const filter = {};
    // Staff/Admin can see inactive ones, public can only see active ones
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
      filter.status = 'active';
    }

    const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single category by id or slug
// @route   GET /api/categories/:idOrSlug
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let query = {};
    
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug };
    }

    const category = await Category.findOne(query);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục này',
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, sortOrder, status } = req.body;
    let image = '';

    if (req.file) {
      image = bufferToBase64(req.file);
    } else if (req.body.image) {
      image = req.body.image;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp hình ảnh cho danh mục',
      });
    }

    // Generate slug if not provided
    const categorySlug = slug || name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const categoryExists = await Category.findOne({ slug: categorySlug });
    if (categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Slug danh mục này đã tồn tại, vui lòng thay đổi',
      });
    }

    const category = await Category.create({
      name,
      slug: categorySlug,
      image,
      description,
      sortOrder: sortOrder || 0,
      status: status || 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công!',
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const { name, slug, description, sortOrder, status } = req.body;
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục cần sửa',
      });
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    if (status) category.status = status;

    if (slug) {
      const categoryExists = await Category.findOne({ slug, _id: { $ne: req.params.id } });
      if (categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Slug danh mục này đã bị trùng lặp',
        });
      }
      category.slug = slug;
    }

    if (req.file) {
      category.image = bufferToBase64(req.file);
    } else if (req.body.image) {
      category.image = req.body.image;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công!',
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục',
      });
    }

    // Check if any products are still under this category
    const Product = require('../models/Product');
    const productsCount = await Product.countDocuments({ categoryId: req.params.id });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục này vì vẫn còn ${productsCount} sản phẩm trực thuộc. Vui lòng xóa hoặc di chuyển các sản phẩm trước.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Xóa danh mục thành công!',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
