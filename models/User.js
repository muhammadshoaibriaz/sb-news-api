const mongoose = require("mongoose");
const usersSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    image: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    articles: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  },
  { timestamps: true }
);

const Users = mongoose.model("users", usersSchema);
module.exports = Users;

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjhiYjk5NWFhYzBhMmE2N2I2YmJiZDEiLCJlbWFpbCI6InVzZXJAZ21haWwuY29tIiwiaWF0IjoxNzIwNDMzMDY3LCJleHAiOjE3MjA1MTk0Njd9.t01NTGUith_ZzJkgvh6NlgjeXl1SP3L3UxB4PB_8kT0
