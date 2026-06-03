const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng cung cấp tên sản phẩm'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    code: {
      type: String,
      required: [true, 'Vui lòng cung cấp mã sản phẩm'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Vui lòng chọn danh mục'],
    },
    price: {
      type: Number,
      required: [true, 'Vui lòng cung cấp giá bán'],
      min: [0, 'Giá bán không thể nhỏ hơn 0'],
    },
    oldPrice: {
      type: Number,
      min: [0, 'Giá cũ không thể nhỏ hơn 0'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Giá khuyến mãi không thể nhỏ hơn 0'],
    },
    images: {
      type: [String],
      required: [true, 'Vui lòng cung cấp ít nhất một hình ảnh'],
      validate: [array => array.length > 0, 'Sản phẩm phải có ít nhất một hình ảnh'],
    },
    description: {
      type: String,
      required: [true, 'Vui lòng cung cấp mô tả sản phẩm'],
      trim: true,
    },
    ingredients: {
      type: String,
      trim: true,
    },
    flavor: {
      type: [String],
      required: [true, 'Vui lòng cung cấp hương vị sản phẩm'],
    },
    size: {
      type: [String],
      required: [true, 'Vui lòng cung cấp kích cỡ sản phẩm'],
    },
    weight: {
      type: String,
      trim: true,
    },
    serving: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'Vui lòng cung cấp số lượng tồn kho'],
      min: [0, 'Số lượng tồn kho không thể âm'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['available', 'out_of_stock', 'hidden', 'coming_soon', 'need_preorder'],
      default: 'available',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isSeasonal: {
      type: Boolean,
      default: false,
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: val => Math.round(val * 10) / 10, // Round to 1 decimal place
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for search
productSchema.index({ name: 'text', code: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
