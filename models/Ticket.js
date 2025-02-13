const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  ticketId: { type: String, required: true, unique: true }, // ✅ Pastikan unik per event
  qrCode: { type: String, required: true },
  hadir: { type: Boolean, default: false },
});

const ticketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  nama: { type: String, required: true },
  email: { type: String, required: true },
  noHp: { type: String, required: true },
  buktiTransfer: { type: String, required: true }, // Cloudinary URL
  events: { type: [eventSchema], required: true }, // ✅ Array event dengan `ticketId` unik
});

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = Ticket;
