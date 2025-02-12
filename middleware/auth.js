const jwt = require("jsonwebtoken");
const JWT_SECRET = "secret-key"; // Sama dengan yang digunakan di login

module.exports = function (req, res, next) {
  const token = req.header("Authorization");

  if (!token)
    return res
      .status(401)
      .json({
        success: false,
        message: "Akses ditolak, token tidak ditemukan!",
      });

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Token tidak valid!" });
  }
};
