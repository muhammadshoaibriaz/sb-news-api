const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String },
  followers: { type: Array, default: [] },
  following: { type: Array, default: [] },
  articles: { type: Array, default: [] },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 }, // Auto-delete after 1 hour
  bio: String,
  preferences: [String],
  role: { type: String, default: "user" },
  fcmToken: String,
});

const TempUsers = mongoose.model("TempUsers", tempUserSchema);
module.exports = TempUsers;
