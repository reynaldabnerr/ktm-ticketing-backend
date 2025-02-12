const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "❌ Akses ditolak!" });
    }

    const decoded = jwt.verify(token, "secret-key"); // 🔥 Gunakan secret-key yang sama dengan login
    req.user = decoded; // 🔥 Pastikan email ada di `req.user`

    console.log("🔑 User setelah decode JWT:", req.user);
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "❌ Token tidak valid!" });
  }
};
