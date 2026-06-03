const multer = require('multer');

// File filter (Only allow images)
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận các định dạng tệp ảnh (.jpeg, .jpg, .png, .webp)'), false);
  }
};

// Memory storage setup for all uploads
const storage = multer.memoryStorage();

// Expose configured upload handlers
const uploadProduct = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFilter,
});

const uploadCustomCake = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadTeaBreak = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadReview = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: imageFilter,
});

// Helper function to convert a multer file buffer to Base64 Data URI
const bufferToBase64 = (file) => {
  if (!file) return '';
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
};

module.exports = {
  uploadProduct,
  uploadCustomCake,
  uploadTeaBreak,
  uploadReview,
  uploadAvatar,
  bufferToBase64,
};
