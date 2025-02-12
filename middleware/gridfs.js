const mongoose = require("mongoose");
const Grid = require("gridfs-stream");
const { GridFsStorage } = require("multer-gridfs-storage");
const multer = require("multer");
require("dotenv").config();

// 🔥 Koneksi ke MongoDB
const conn = mongoose.connection;

// 🔹 Inisialisasi GridFS
let gfs;
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads"); // Koleksi file
});

// 🔹 Konfigurasi penyimpanan GridFS
const storage = new GridFsStorage({
  url: process.env.MONGO_URI, // 🔥 Gunakan MongoDB Atlas
  file: (req, file) => {
    return {
      bucketName: "uploads", // Koleksi untuk file
      filename: Date.now() + "-" + file.originalname,
    };
  },
});

const upload = multer({ storage });

module.exports = { upload, gfs };
