// services/s3.js  –  AWS S3 upload helper
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// ── File type filter ────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) cb(null, true);
  else cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'));
};

// ── S3 storage engine ───────────────────────────────────────────────────────
const upload = multer({
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `products/${unique}${path.extname(file.originalname)}`);
    },
  }),
});

// ── Delete a file from S3 ───────────────────────────────────────────────────
const deleteFromS3 = async (fileUrl) => {
  try {
    // extract key from full S3 URL
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // remove leading "/"
    await s3.deleteObject({ Bucket: process.env.S3_BUCKET_NAME, Key: key }).promise();
  } catch (err) {
    console.error('S3 delete error:', err.message);
  }
};

module.exports = { upload, deleteFromS3, s3 };
