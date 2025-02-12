require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5001;

// 🔥 Pasang CORS Middleware terlebih dahulu
app.use(
  cors({
    origin: "*", // Bisa diganti dengan domain frontend misalnya "https://ktm-ticketing.vercel.app"
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

// 🔥 Pasang Middleware JSON sebelum routes
app.use(express.json());

// 🔥 Koneksi ke MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database connected!"))
  .catch((err) => console.error("❌ Database connection error:", err));

// 🔥 Pasang routes setelah middleware
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

const ticketRoutes = require("./routes/tickets");
app.use("/tickets", ticketRoutes);

// Endpoint Tes API
app.get("/", (req, res) => {
  res.send("🚀 KTM Ticketing API is running...");
});

// 🔥 Start Server
app.listen(port, () => {
  console.log(`✅ Server berjalan di http://localhost:${port}`);
});
