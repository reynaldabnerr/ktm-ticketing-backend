const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  nama: { type: String, default: "" },
  buktiTransfer: { type: String, default: "" }, // Untuk menyimpan gambar bukti transfer
  ticketId: { type: String, default: "" }, // Untuk menyimpan ID tiket setelah transfer berhasil
  qrCode: { type: String, default: "" }, // Untuk menyimpan QR Code
});

module.exports = mongoose.model("User", UserSchema);
