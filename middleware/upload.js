const multer = require("multer");
const fs = require("fs");
const path = require("path");

// 🔥 Pastikan folder `uploads/` ada sebelum menyimpan file
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Filter hanya menerima gambar
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("⚠️ Hanya file gambar yang diperbolehkan!"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
