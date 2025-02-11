const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    noHp: { type: String, required: true },
    ticketId: { type: String, unique: true },
    qrCode: { type: String }, // Akan menyimpan QR Code dalam bentuk data URL
    hadir: { type: Boolean, default: false }, // Status kehadiran
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", TicketSchema);
