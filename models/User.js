const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  buktiTransfer: { type: String, default: "" }, // Untuk menyimpan gambar bukti transfer
  ticketId: { type: String, default: "" }, // Untuk menyimpan ID tiket setelah transfer berhasil
  qrCode: { type: String, default: "" }, // Untuk menyimpan QR Code
});

module.exports = mongoose.model("User", UserSchema);
