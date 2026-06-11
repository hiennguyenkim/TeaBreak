const { body, validationResult } = require('express-validator');

// Error formatting helper
const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg, // return the first error message
    });
  }
  next();
};

// Phone regex rule: Vietnamese phone format (starting with 0, 84, or +84 followed by standard mobile prefixes or landlines)
const phoneRegex = /^(0|84|\+84)((3|5|7|8|9)[0-9]{8}|2[0-9]{9})$/;

// Validation rules for Register
exports.validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng cung cấp họ tên'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Địa chỉ Email không đúng định dạng (ví dụ: name@domain.com)'),
  body('phone')
    .trim()
    .customSanitizer(val => val ? val.replace(/[\s\.\-\(\)]/g, '') : '')
    .matches(phoneRegex)
    .withMessage('Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0988888888)'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải chứa ít nhất 6 ký tự'),
  checkValidationResult
];

// Validation rules for Change Password
exports.validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Vui lòng cung cấp mật khẩu hiện tại'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải chứa ít nhất 6 ký tự'),
  checkValidationResult
];

// Validation rules for Reset Password
exports.validateResetPassword = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Địa chỉ Email không đúng định dạng'),
  body('otp')
    .notEmpty()
    .withMessage('Vui lòng cung cấp mã OTP'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải chứa ít nhất 6 ký tự'),
  checkValidationResult
];

// Validation rules for Update Profile
exports.validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Họ tên không được bỏ trống'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Địa chỉ Email không đúng định dạng'),
  body('phone')
    .optional()
    .trim()
    .customSanitizer(val => val ? val.replace(/[\s\.\-\(\)]/g, '') : '')
    .matches(phoneRegex)
    .withMessage('Số điện thoại không đúng định dạng Việt Nam'),
  checkValidationResult
];

// Validation rules for Admin creating a user
exports.validateAdminCreateUser = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng cung cấp họ tên'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Địa chỉ Email không đúng định dạng'),
  body('phone')
    .trim()
    .customSanitizer(val => val ? val.replace(/[\s\.\-\(\)]/g, '') : '')
    .matches(phoneRegex)
    .withMessage('Số điện thoại không đúng định dạng Việt Nam'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu khởi tạo phải chứa ít nhất 6 ký tự'),
  checkValidationResult
];

// Validation rules for Admin updating a user
exports.validateAdminUpdateUser = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Họ tên không được bỏ trống'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Địa chỉ Email không đúng định dạng'),
  body('phone')
    .optional()
    .trim()
    .customSanitizer(val => val ? val.replace(/[\s\.\-\(\)]/g, '') : '')
    .matches(phoneRegex)
    .withMessage('Số điện thoại không đúng định dạng Việt Nam'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải chứa ít nhất 6 ký tự'),
  checkValidationResult
];

// Validation rules for Delivery Address
exports.validateAddress = [
  body('receiverName')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng cung cấp tên người nhận'),
  body('phone')
    .trim()
    .customSanitizer(val => val ? val.replace(/[\s\.\-\(\)]/g, '') : '')
    .matches(phoneRegex)
    .withMessage('Số điện thoại không đúng định dạng Việt Nam'),
  body('addressDetail')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng cung cấp địa chỉ chi tiết (số nhà, tên đường)'),
  body('ward')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng cung cấp Phường/Xã'),
  body('district')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng cung cấp Quận/Huyện'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng cung cấp Tỉnh/Thành phố'),
  checkValidationResult
];

// Validation rules for Placing Order
exports.validateOrder = [
  body('fullname')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng cung cấp họ tên người nhận'),
  body('phone')
    .trim()
    .customSanitizer(val => val ? val.replace(/[\s\.\-\(\)]/g, '') : '')
    .matches(phoneRegex)
    .withMessage('Số điện thoại không đúng định dạng Việt Nam'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Vui lòng cung cấp email liên hệ hợp lệ'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng cung cấp địa chỉ nhận hàng'),
  checkValidationResult
];

// Validation rules for Product price checks
exports.validateProduct = [
  body('price')
    .isInt({ min: 0 })
    .withMessage('Giá tiền phải là số nguyên dương'),
  checkValidationResult
];
