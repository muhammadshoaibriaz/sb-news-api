const mongoose = require("mongoose");
const usersSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    image: { type: String },
    bio: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    preferences: [String],
    role: { type: String, default: "user" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    articles: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
    fcmToken: { type: String },
  },
  { timestamps: true }
);

const Users = mongoose.model("users", usersSchema);
module.exports = Users;
