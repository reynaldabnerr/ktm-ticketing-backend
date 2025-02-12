const multer = require("multer");

// Konfigurasi penyimpanan gambar bukti transfer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Simpan di folder uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Rename file agar unik
  },
});

const upload = multer({ storage });

module.exports = upload;
