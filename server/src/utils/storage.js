// File storage: Cloudinary when CLOUDINARY_URL is set, otherwise local disk (/uploads).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = ['application/pdf', 'video/mp4', 'video/webm', 'image/png', 'image/jpeg'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, MP4/WebM video or images are allowed')),
});

const useCloudinary = Boolean(process.env.CLOUDINARY_URL);

async function saveFile(file) {
  if (useCloudinary) {
    const cloudinary = require('cloudinary').v2;
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'siksha', resource_type: 'auto' }, (err, r) => (err ? reject(err) : resolve(r)))
        .end(file.buffer);
    });
    return result.secure_url;
  }
  const ext = path.extname(file.originalname) || '';
  const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  await fs.promises.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
  return `/uploads/${name}`;
}

module.exports = { upload, saveFile, UPLOAD_DIR, useCloudinary };
