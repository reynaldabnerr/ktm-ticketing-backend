const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Koneksi ke MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database connected!"))
  .catch((err) => {
    console.error("❌ Database connection error:", err);
    process.exit(1); // Jika gagal, hentikan server
  });

// Routes
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

const ticketRoutes = require("./routes/tickets");
app.use("/tickets", ticketRoutes);

const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Endpoint Tes API
app.get("/", (req, res) => {
  res.send("🚀 KTM Ticketing API is running...");
});

// Start Server
app.listen(port, () => {
  console.log(`✅ Server berjalan di port ${port}`);
});
