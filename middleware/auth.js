const jwt = require("jsonwebtoken");

module.exports = function authMiddleware(req, res, next) {
  const token = req.header("Authorization");

  if (!token) {
    return res
      .status(401)
      .json({
        success: false,
        message: "❌ Akses ditolak! Token tidak ditemukan.",
      });
  }

  try {
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET || "secret-key"
    );
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: "❌ Token tidak valid!" });
  }
};
