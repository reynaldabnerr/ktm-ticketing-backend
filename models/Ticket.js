const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Hubungkan tiket ke user
    nama: { type: String, required: true },
    email: { type: String, required: true },
    noHp: { type: String, required: true },
    buktiTransfer: { type: String, required: true }, // Simpan path bukti transfer
    ticketId: { type: String, unique: true, required: true },
    qrCode: { type: String, required: true },
    hadir: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", TicketSchema);
