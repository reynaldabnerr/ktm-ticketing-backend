const express = require("express");
const QRCode = require("qrcode");
const Ticket = require("../models/Ticket");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const authMiddleware = require("../middleware/auth"); // Middleware autentikasi
const upload = require("../middleware/upload"); // Middleware upload gambar

const router = express.Router();

// 🔹 API Registrasi Tiket & Generate QR Code
router.post("/register", authMiddleware, async (req, res) => {
  try {
    const { nama, email, noHp } = req.body;
    const ticketId = Math.random().toString(36).substring(2, 10);

    // Generate QR Code
    const qrCode = await QRCode.toDataURL(ticketId);

    // Simpan ke database dengan userId
    const newTicket = new Ticket({
      userId: req.user.id,
      nama,
      email,
      noHp,
      ticketId,
      qrCode,
    });

    await newTicket.save();

    res.json({
      success: true,
      message: "🎫 Tiket berhasil dibuat!",
      ticket: newTicket,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "❌ Gagal membuat tiket!",
      error: err.message,
    });
  }
});

// 🔹 API Check-in & Update Status "Hadir"
router.post("/check-in", async (req, res) => {
  try {
    const { ticketId } = req.body;
    const ticket = await Ticket.findOne({ ticketId });

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Tiket tidak ditemukan!" });
    }

    if (ticket.hadir) {
      return res
        .status(400)
        .json({
          success: false,
          message: "⚠️ Tiket sudah digunakan untuk check-in!",
        });
    }

    // Update status "hadir"
    ticket.hadir = true;
    await ticket.save();

    res.json({ success: true, message: "✅ Tiket berhasil check-in!", ticket });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "❌ Gagal melakukan check-in!",
        error: error.message,
      });
  }
});

// 🔹 API Melihat Semua Tiket (Dashboard Admin)
router.get("/all", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "❌ Gagal mengambil data tiket!",
        error: err.message,
      });
  }
});

// 🔹 API Export Data ke Excel
router.get("/export-excel", async (req, res) => {
  try {
    const tickets = await Ticket.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Daftar Customer");

    worksheet.columns = [
      { header: "Nama", key: "nama", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "No HP", key: "noHp", width: 20 },
      { header: "Ticket ID", key: "ticketId", width: 15 },
      { header: "Hadir", key: "hadir", width: 10 },
    ];

    tickets.forEach((ticket) => {
      worksheet.addRow({
        nama: ticket.nama,
        email: ticket.email,
        noHp: ticket.noHp,
        ticketId: ticket.ticketId,
        hadir: ticket.hadir ? "✅" : "❌",
      });
    });

    const filePath = path.join(__dirname, "../Daftar_Customer.xlsx");
    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, "Daftar_Customer.xlsx", () => {
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "❌ Gagal export data!",
        error: err.message,
      });
  }
});

// 🔹 API Melihat Tiket User yang Login
router.get("/my-tickets", authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.user.id });

    res.json({ success: true, tickets });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "❌ Gagal mengambil tiket",
        error: error.message,
      });
  }
});

// 🔹 API Input Data (Nama, No HP, Bukti Transfer) & Generate QR Code
router.post(
  "/input-data",
  authMiddleware,
  upload.single("buktiTransfer"),
  async (req, res) => {
    try {
      console.log("✅ Data dari request body:", req.body);
      console.log("📸 File bukti transfer:", req.file);
      console.log("🔑 User dari token:", req.user);

      const { nama, noHp } = req.body;
      const email = req.user.email; // 🔥 Ambil email dari token JWT
      const buktiTransfer = req.file ? req.file.id : null; // 🔥 Simpan ObjectId file

      if (!nama || !noHp || !buktiTransfer) {
        console.log("⚠️ Data tidak lengkap!", { nama, noHp, buktiTransfer });
        return res
          .status(400)
          .json({ success: false, message: "⚠️ Semua data wajib diisi!" });
      }

      // Cek apakah user sudah memiliki tiket
      const existingTicket = await Ticket.findOne({ userId: req.user.id });
      if (existingTicket) {
        return res
          .status(400)
          .json({ success: false, message: "⚠️ Anda sudah memiliki tiket!" });
      }

      // Generate Ticket ID & QR Code
      const ticketId = Math.random().toString(36).substring(2, 10);
      const qrCode = await QRCode.toDataURL(ticketId);

      // Simpan ke database
      const newTicket = new Ticket({
        userId: req.user.id,
        nama,
        email, // 🔥 Gunakan email dari token JWT
        noHp,
        buktiTransfer,
        ticketId,
        qrCode,
      });

      await newTicket.save();

      res.json({
        success: true,
        message: "✅ Data berhasil disimpan & QR Code dibuat!",
        ticket: newTicket,
      });
    } catch (err) {
      console.error("❌ Error backend:", err.message);
      res.status(500).json({
        success: false,
        message: "❌ Gagal menyimpan data!",
        error: err.message,
      });
    }
  }
);
module.exports = router;
