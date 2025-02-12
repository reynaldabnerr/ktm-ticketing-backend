require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5001;
const authRoutes = require("./routes/auth");

app.use("/auth", authRoutes);

// Middleware
app.use(cors());
app.use(express.json());

// Koneksi ke MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database connected!"))
  .catch((err) => console.error("❌ Database connection error:", err));

// Endpoint Tes API
app.get("/", (req, res) => {
  res.send("🚀 KTM Ticketing API is running...");
});

// Start Server
app.listen(port, () => {
  console.log(`✅ Server berjalan di http://localhost:${port}`);
});

const ticketRoutes = require("./routes/tickets");
app.use("/tickets", ticketRoutes);