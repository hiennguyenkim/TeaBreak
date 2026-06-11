const mongoose = require('mongoose');

const deliveryAddressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverName: {
      type: String,
      required: [true, 'Vui lòng cung cấp tên người nhận'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Vui lòng cung cấp số điện thoại người nhận'],
      trim: true,
      set: val => val ? val.replace(/[\s\.\-\(\)]/g, '') : val,
      match: [
        /^(0|84|\+84)((3|5|7|8|9)[0-9]{8}|2[0-9]{9})$/,
        'Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0988888888)',
      ],
    },
    addressDetail: {
      type: String,
      required: [true, 'Vui lòng cung cấp địa chỉ chi tiết (số nhà, tên đường)'],
      trim: true,
    },
    ward: {
      type: String,
      required: [true, 'Vui lòng cung cấp Phường/Xã'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'Vui lòng cung cấp Quận/Huyện'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Vui lòng cung cấp Tỉnh/Thành phố'],
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// If saving a new address as default, unset other default addresses for this user
deliveryAddressSchema.pre('save', async function () {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
});

module.exports = mongoose.model('DeliveryAddress', deliveryAddressSchema);
