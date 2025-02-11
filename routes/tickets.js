const express = require("express");
const QRCode = require("qrcode");
const Ticket = require("../models/Ticket");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// API untuk Registrasi Tiket & Generate QR Code
router.post("/register", async (req, res) => {
  try {
    const { nama, email, noHp } = req.body;
    const ticketId = Math.random().toString(36).substring(2, 10); // Generate Ticket ID

    // Generate QR Code
    const qrCode = await QRCode.toDataURL(
      `https://yourwebsite.com/validate/${ticketId}`
    );

    // Simpan ke database
    const newTicket = new Ticket({ nama, email, noHp, ticketId, qrCode });
    await newTicket.save();

    res.json({
      success: true,
      message: "Tiket berhasil dibuat!",
      ticket: newTicket,
    });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal membuat tiket!",
        error: err.message,
      });
  }
});

// API untuk Scan QR Code dan Check-in
router.post("/check-in", async (req, res) => {
  try {
    const { ticketId } = req.body;

    // Cari tiket berdasarkan ticketId
    const ticket = await Ticket.findOne({ ticketId });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Tiket tidak ditemukan!" });
    }

    if (ticket.hadir) {
      return res.status(400).json({ success: false, message: "Tiket sudah digunakan!" });
    }

    // Tandai sebagai hadir
    ticket.hadir = true;
    await ticket.save();

    res.json({ success: true, message: "Check-in berhasil!", ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal memproses check-in!", error: err.message });
  }
});

// API untuk Melihat Semua Tiket (Dashboard Admin)
router.get("/all", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 }); // Urutkan dari terbaru
    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal mengambil data tiket!", error: err.message });
  }
});


// API untuk Export Data ke Excel
router.get("/export-excel", async (req, res) => {
  try {
    const tickets = await Ticket.find(); // Ambil semua data tiket

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Daftar Customer");

    // Buat Header Kolom
    worksheet.columns = [
      { header: "Nama", key: "nama", width: 30 },
      { header: "Email", key: "email", width: 30 },
      { header: "No HP", key: "noHp", width: 20 },
      { header: "Ticket ID", key: "ticketId", width: 15 },
      { header: "Hadir", key: "hadir", width: 10 },
    ];

    // Tambahkan Data dari Database
    tickets.forEach((ticket) => {
      worksheet.addRow({
        nama: ticket.nama,
        email: ticket.email,
        noHp: ticket.noHp,
        ticketId: ticket.ticketId,
        hadir: ticket.hadir ? "✅" : "❌",
      });
    });

    // Simpan file sementara dan kirim ke user
    const filePath = path.join(__dirname, "../Daftar_Customer.xlsx");
    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, "Daftar_Customer.xlsx", () => {
      fs.unlinkSync(filePath); // Hapus file setelah di-download
    });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal export data!",
        error: err.message,
      });
  }
});
module.exports = router;
