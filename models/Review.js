const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Vui lòng cung cấp số sao đánh giá (1-5)'],
      min: 1,
      max: 5,
    },
    content: {
      type: String,
      required: [true, 'Vui lòng cung cấp nội dung nhận xét'],
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    reply: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'hidden', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// After a review is saved or updated, we should recalculate the product ratingAverage and reviewCount
reviewSchema.statics.calculateAverageRating = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { productId: productId, status: 'approved' },
    },
    {
      $group: {
        _id: '$productId',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      ratingAverage: stats[0].avgRating,
      reviewCount: stats[0].nRating,
    });
  } else {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      ratingAverage: 0,
      reviewCount: 0,
    });
  }
};

// Call calculateAverageRating after save
reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.productId);
});

// Call calculateAverageRating after update or delete (pre/post middlewares for findOneAndUpdate)
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.productId);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
