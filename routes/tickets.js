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
    console.log("📥 Data diterima dari frontend:", req.body);

    const { ticketId } = req.body;
    if (!ticketId) {
      return res
        .status(400)
        .json({ success: false, message: "⚠️ Ticket ID tidak ditemukan!" });
    }

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

    // ✅ Hanya update status "hadir", tanpa mengubah `userId` atau `buktiTransfer`
    await Ticket.updateOne({ ticketId }, { $set: { hadir: true } });

    console.log("✅ Tiket berhasil diupdate:", ticketId);
    res.json({ success: true, message: "✅ Tiket berhasil check-in!" });
  } catch (error) {
    console.error("❌ Error backend:", error.message);
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

router.get("/tickets/filter", authMiddleware, async (req, res) => {
  try {
    const { event } = req.query;
    let query = {};

    if (event) {
      query.events = event;
    }

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengambil data tiket!",
        error: err.message,
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
      const { nama, noHp, events } = req.body;
      const email = req.user.email;
      const buktiTransfer = req.file ? req.file.path : null;

      if (!nama || !noHp || !buktiTransfer || !events || events.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "⚠️ Semua data wajib diisi!" });
      }

      const ticketId = Math.random().toString(36).substring(2, 10);
      const qrCode = await QRCode.toDataURL(ticketId);

      const newTicket = new Ticket({
        userId: req.user.id,
        nama,
        email,
        noHp,
        buktiTransfer,
        ticketId,
        qrCode,
        events, // 🆕 Simpan event yang dipilih
      });

      await newTicket.save();

      res.json({
        success: true,
        message: "✅ Data berhasil disimpan & QR Code dibuat!",
        ticket: newTicket,
      });
    } catch (err) {
      res
        .status(500)
        .json({
          success: false,
          message: "❌ Gagal menyimpan data!",
          error: err.message,
        });
    }
  }
);

// API untuk mengecek apakah user sudah memiliki tiket
router.get("/check-user-ticket", authMiddleware, async (req, res) => {
  try {
    const existingTicket = await Ticket.findOne({ userId: req.user.id });

    if (existingTicket) {
      return res.json({ success: true, hasTicket: true, ticket: existingTicket });
    } else {
      return res.json({ success: true, hasTicket: false });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengecek tiket!", error: error.message });
  }
});

// Hapus tiket berdasarkan ticketId
router.delete("/delete-ticket/:ticketId", async (req, res) => {
  try {
    const { ticketId } = req.params;
    const deletedTicket = await Ticket.findOneAndDelete({ ticketId });

    if (!deletedTicket) {
      return res.status(404).json({ success: false, message: "❌ Tiket tidak ditemukan!" });
    }

    res.json({ success: true, message: "✅ Tiket berhasil dihapus!" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ Gagal menghapus tiket!",
      error: error.message,
    });
  }
});
module.exports = router;
