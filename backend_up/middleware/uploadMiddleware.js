const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists (auto-creates on production if missing)
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename: remove spaces and special chars, keep extension
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
    cb(null, `${Date.now()}-${sanitizedName}`);
  },
});

// Create the multer instance
const upload = multer({ storage });

module.exports = upload;
