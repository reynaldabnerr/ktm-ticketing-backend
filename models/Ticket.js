const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  nama: { type: String, required: true },
  email: { type: String, required: true },
  noHp: { type: String, required: true },
  buktiTransfer: { type: String, required: true }, // URL dari Cloudinary
  events: [
    {
      nama: {
        type: String,
        enum: ["Event 1", "Event 2", "Event 3", "Event 4"],
        required: true,
      },
      ticketId: { type: String, required: true, unique: true }, // ID unik per event
      qrCode: { type: String, required: true }, // QR Code unik per event
      hadir: { type: Boolean, default: false }, // Status check-in
    },
  ],
});

module.exports = mongoose.model("Ticket", TicketSchema);
