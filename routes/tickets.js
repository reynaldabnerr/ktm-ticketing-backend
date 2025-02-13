const express = require("express");
const QRCode = require("qrcode");
const Ticket = require("../models/Ticket");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const authMiddleware = require("../middleware/auth"); // Middleware autentikasi
const upload = require("../middleware/upload");

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

// 🔥 Check-in berdasarkan ticketId yang ada di dalam array events
router.post("/check-in", async (req, res) => {
  try {
    const { ticketId } = req.body;

    // Cari tiket yang memiliki ticketId di dalam array `events`
    const ticket = await Ticket.findOne({ "events.ticketId": ticketId });

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Tiket tidak ditemukan!" });
    }

    // Temukan event yang sesuai di dalam array `events`
    const eventIndex = ticket.events.findIndex((e) => e.ticketId === ticketId);
    if (eventIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Tiket tidak ditemukan di event!" });
    }

    if (ticket.events[eventIndex].hadir) {
      return res
        .status(400)
        .json({
          success: false,
          message: "⚠️ Tiket sudah digunakan untuk check-in!",
        });
    }

    // 🔥 Update status hadir hanya untuk tiket yang sesuai
    ticket.events[eventIndex].hadir = true;
    await ticket.save();

    res.json({
      success: true,
      message: "✅ Tiket berhasil check-in!",
      ticket,
    });
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
    res.status(500).json({
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
    res.status(500).json({
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
    res.status(500).json({
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
    res.status(500).json({
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
      const userId = req.user.id;

      console.log("📥 Data diterima di backend:", {
        nama,
        noHp,
        events,
        email,
      });

      // 🔍 Pastikan semua field telah diisi
      if (!nama || !noHp || !events || events.length === 0 || !req.file) {
        return res
          .status(400)
          .json({ success: false, message: "⚠️ Semua data wajib diisi!" });
      }

      // Konversi events menjadi array
      const allowedEvents = ["Event 1", "Event 2", "Event 3", "Event 4"];
      const selectedEvents = JSON.parse(events).filter((event) =>
        allowedEvents.includes(event)
      );

      if (selectedEvents.length === 0) {
        return res.status(400).json({
          success: false,
          message: "⚠️ Pilih minimal 1 event yang valid!",
        });
      }

      // 🔥 Ambil URL Bukti Transfer dari Cloudinary
      const buktiTransferURL = req.file.path;

      console.log("✅ Bukti Transfer URL:", buktiTransferURL);

      // 🔥 Generate QR Code untuk setiap event
      const eventsData = await Promise.all(
        selectedEvents.map(async (event) => {
          const ticketId = Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase();
          const qrCode = await QRCode.toDataURL(ticketId);
          return { nama: event, ticketId, qrCode, hadir: false };
        })
      );

      // 🔥 Simpan tiket ke database
      const newTicket = new Ticket({
        userId,
        nama,
        email,
        noHp,
        buktiTransfer: buktiTransferURL, // ✅ URL dari Cloudinary
        events: eventsData,
      });

      await newTicket.save();

      res.json({
        success: true,
        message: "✅ Data berhasil disimpan!",
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

router.delete("/delete-ticket/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log("🗑️ Menghapus tiket dengan Event ID:", eventId);

    // 🔥 Mencari tiket yang memiliki event dengan _id tersebut
    const ticket = await Ticket.findOneAndUpdate(
      { "events._id": eventId },
      { $pull: { events: { _id: eventId } } }, // 🔥 Menghapus event dari array
      { new: true }
    );

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Tiket tidak ditemukan!" });
    }

    // Jika semua event dihapus, hapus juga tiket utama
    if (ticket.events.length === 0) {
      await Ticket.findByIdAndDelete(ticket._id);
    }

    res.json({ success: true, message: "✅ Tiket berhasil dihapus!" });
  } catch (error) {
    console.error("❌ Error menghapus tiket:", error.message);
    res
      .status(500)
      .json({ success: false, message: "❌ Gagal menghapus tiket!" });
  }
});

module.exports = router;
