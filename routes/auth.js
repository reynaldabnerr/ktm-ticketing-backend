const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = "secret-key"; // Gantilah dengan yang lebih aman

// Register User
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Periksa apakah email sudah terdaftar
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email sudah terdaftar!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru tanpa nama
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.json({ success: true, message: "User berhasil didaftarkan!" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan saat registrasi" });
  }
});

// Login User
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Email tidak terdaftar!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Password salah!" });

    // 🔥 Hanya gunakan SATU deklarasi `token` yang benar
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      success: true,
      token,
      user: { nama: user.nama, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saat login" });
  }
});

module.exports = router;
