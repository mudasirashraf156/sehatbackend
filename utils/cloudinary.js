const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Creates a multer upload middleware that stores files directly to Cloudinary.
 * @param {string} folder - Cloudinary folder name (e.g. 'shops', 'medicines')
 */
function createCloudinaryUpload(folder) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `sehatsehul/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }],
    },
  });
  return multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
}

module.exports = { cloudinary, createCloudinaryUpload };
