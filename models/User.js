const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

module.exports = mongoose.model("User", UserSchema);
