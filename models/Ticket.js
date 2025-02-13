const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nama: { type: String, required: true },
    email: { type: String, required: true },
    noHp: { type: String, required: true },
    buktiTransfer: { type: String, required: true },
    ticketId: { type: String, unique: true, required: true },
    qrCode: { type: String, required: true },
    hadir: { type: Boolean, default: false },
    events: [
      { type: String, enum: ["Event 1", "Event 2", "Event 3", "Event 4"] },
    ], // 🆕 Tambahkan array event
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", TicketSchema);
