const User = require('../models/User');
const DeliveryAddress = require('../models/DeliveryAddress');
const { bufferToBase64 } = require('../middlewares/uploadMiddleware');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address !== undefined) user.address = address;

    if (req.file) {
      user.avatar = bufferToBase64(req.file);
    } else if (req.body.avatar !== undefined) {
      user.avatar = req.body.avatar;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công!',
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user address book
// @route   GET /api/users/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await DeliveryAddress.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add a delivery address
// @route   POST /api/users/addresses
// @access  Private
exports.addAddress = async (req, res) => {
  try {
    const { receiverName, phone, addressDetail, ward, district, city, isDefault } = req.body;

    // Check if it's the first address, make it default automatically
    const addressCount = await DeliveryAddress.countDocuments({ userId: req.user.id });
    const makeDefault = addressCount === 0 ? true : !!isDefault;

    const address = await DeliveryAddress.create({
      userId: req.user.id,
      receiverName,
      phone,
      addressDetail,
      ward,
      district,
      city,
      isDefault: makeDefault,
    });

    res.status(201).json({
      success: true,
      message: 'Thêm địa chỉ giao hàng thành công!',
      address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update a delivery address
// @route   PUT /api/users/addresses/:id
// @access  Private
exports.updateAddress = async (req, res) => {
  try {
    const { receiverName, phone, addressDetail, ward, district, city, isDefault } = req.body;
    let address = await DeliveryAddress.findOne({ _id: req.params.id, userId: req.user.id });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Địa chỉ không tồn tại hoặc bạn không có quyền truy cập',
      });
    }

    if (receiverName) address.receiverName = receiverName;
    if (phone) address.phone = phone;
    if (addressDetail) address.addressDetail = addressDetail;
    if (ward) address.ward = ward;
    if (district) address.district = district;
    if (city) address.city = city;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await address.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật địa chỉ thành công!',
      address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete a delivery address
// @route   DELETE /api/users/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
  try {
    const address = await DeliveryAddress.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Địa chỉ không tồn tại hoặc bạn không có quyền truy cập',
      });
    }

    // If we deleted the default address, set another address as default if exists
    if (address.isDefault) {
      const nextAddress = await DeliveryAddress.findOne({ userId: req.user.id });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Xóa địa chỉ thành công!',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= ADMIN & STAFF OPERATIONS =================

// @desc    Get all accounts (Admin / Staff)
// @route   GET /api/users
// @access  Private (Admin / Staff)
exports.getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user status / lock unlock (Admin only)
// @route   PUT /api/users/:id/status
// @access  Private (Admin only)
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người dùng',
      });
    }

    if (user.role === 'admin' && req.user.id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không được phép khóa tài khoản Admin khác',
      });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Đã ${status === 'blocked' ? 'khóa' : 'mở khóa'} tài khoản thành công!`,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private (Admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò không hợp lệ',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người dùng',
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật vai trò người dùng thành công!',
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create a staff account (Admin only)
// @route   POST /api/users/staff
// @access  Private (Admin only)
exports.createStaffAccount = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký tài khoản khác',
      });
    }

    const staff = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role: 'staff',
    });

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản nhân viên thành công!',
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create any role user account (Admin only)
// @route   POST /api/users
// @access  Private (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, address, role, status } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký tài khoản khác',
      });
    }

    let avatarPath = '';
    if (req.file) {
      avatarPath = bufferToBase64(req.file);
    } else if (req.body.avatar) {
      avatarPath = req.body.avatar;
    }

    const newUser = await User.create({
      name,
      email,
      password,
      phone,
      address,
      avatar: avatarPath,
      role: role || 'user',
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công!',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        avatar: newUser.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user account details (Admin only)
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, password, phone, address, role, status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người dùng',
      });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email này đã được đăng ký tài khoản khác',
        });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (role) user.role = role;
    if (status) user.status = status;
    if (password) user.password = password; // pre-save hook will hash it automatically

    if (req.file) {
      user.avatar = bufferToBase64(req.file);
    } else if (req.body.avatar !== undefined) {
      user.avatar = req.body.avatar;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật tài khoản thành công!',
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete user account (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản',
      });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự xóa tài khoản của chính mình',
      });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa tài khoản Admin cuối cùng của hệ thống',
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Xóa tài khoản thành công!',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
