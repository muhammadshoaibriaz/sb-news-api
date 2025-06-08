const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: false,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: false,
  },
  type: { type: String, enum: ["like", "comment", "follow"], required: true },
  message: { type: String, required: true },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "post",
    required: false,
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
