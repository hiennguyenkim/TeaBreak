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

// Phone regex rule: starting with 0, 84, or +84, followed by 3, 5, 7, 8, or 9, followed by 8 digits
const phoneRegex = /^(0|84|\+84)(3|5|7|8|9)[0-9]{8}$/;

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
    .matches(phoneRegex)
    .withMessage('Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0988888888, gồm 10 chữ số)'),
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
    .matches(phoneRegex)
    .withMessage('Số điện thoại không đúng định dạng Việt Nam (gồm 10 chữ số)'),
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
    .matches(phoneRegex)
    .withMessage('Số điện thoại không đúng định dạng Việt Nam (gồm 10 chữ số)'),
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
    .matches(phoneRegex)
    .withMessage('Số điện thoại không đúng định dạng Việt Nam (gồm 10 chữ số)'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải chứa ít nhất 6 ký tự'),
  checkValidationResult
];
