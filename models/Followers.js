const mongoose = require("mongoose");
const followerSchema = new mongoose.model({
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  followers: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  startedFollowing: {
    type: Date,
    default: Date.now,
  },
});

const Followers = mongoose.model("Followers", followerSchema);
module.exports = Followers;
