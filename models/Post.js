const mongoose = require("mongoose");

const commentRepliesOnPost = new mongoose.Schema({
  replyText: { type: String, required: true },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  repliedAt: { type: Date, default: Date.now },
});

const commentSchema = new mongoose.Schema({
  commentText: { type: String, required: true },
  commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  commentedAt: { type: Date, default: Date.now },
  commentReplies: [commentRepliesOnPost],
});

const createPost = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  comments: [commentSchema],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  datePosted: { type: Date, default: Date.now },
});

const Post = mongoose.model("post", createPost);
module.exports = Post;
