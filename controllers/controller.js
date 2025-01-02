const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcryptjs = require("bcryptjs");
const cloudinary = require("cloudinary");
const Post = require("../models/Post");
const Users = require("../models/User");
const Admin = require("../models/Admin");
const nodemailer = require("nodemailer");
const TempUsers = require("../models/TempUser");
const admin = require("firebase-admin");

const sendConfirmationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL, // Your email
      pass: process.env.EMAIL_PASSWORD, // Your email password
    },
    secure: true,
    host: "smtp.gmail.com",
    port: 465, // For TLS
  });

  const confirmationLink = `https://sb-news-api-production.up.railway.app/confirm-email?token=${token}`;
  console.log(confirmationLink);
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Email Confirmation",
    text: `Click the link to confirm your email: ${confirmationLink}`,
  };
  return await transporter.sendMail(mailOptions);
};
const sendNotification = async (token, title, body) => {
  const message = {
    notification: {
      title,
      body,
    },
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Notification sent successfully:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

const sendNotificationToFollowers = async () => {
  const payload = {
    notification: {
      title: "New Post Alert!",
      body: message,
    },
  };

  admin
    .messaging()
    .sendToDevice(tokens, payload)
    .then((response) => {
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
};

const SendNotificationToFollowers = async (req, res) => {
  const { title, body } = req.body;
  try {
    const followers = await Users.find({ followers: req.user._id });
    console.log("followers", followers);
    return;
    const tokens = followers.map((user) => user.fcmToken);
    console.log("tokens", tokens);
    await sendNotificationToFollowers(tokens, title, body);
    return res.status(200).json({ message: "Notification sent successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error sending notification" });
  }
};

const SendNotify = async (req, res) => {
  const { token, title, body } = req.body;
  if (!token || !title || !body) {
    return res.status(400).send({ error: "Missing required fields" });
  }

  try {
    await sendNotification(token, title, body);
    return res.send({ success: true });
  } catch (error) {
    return res.status(500).send({ error: "Failed to send notification" });
  }
};

const EmptyPage = async (req, res) => {
  res.send({ message: "Welcome to Trinity" });
};

const AdminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(200).json({ message: "admin user not exist " });
    }
    const isMatch = await bcryptjs.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "password is not correct" });
    }
    const token = jwt.sign(
      { userId: admin?._id, email: admin?.email },
      process.env.SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );
    return res.status(200).json({ message: "Admin logged in", token, admin });
  } catch (error) {
    console.log("Error while logging in", error.message);
  }
};

const User = async (req, res) => {
  const {
    username,
    email,
    password,
    image,
    followers,
    following,
    articles,
    preferences,
    bio,
    fcmToken,
  } = req.body;
  try {
    const isExist = await Users.findOne({ email });
    const uploadUrl = await cloudinary.uploader.upload(image, {
      upload_preset: "my_preset",
    });
    // console.log(uploadUrl);
    // return;
    if (isExist) {
      return res.status(200).json({ error: "User already exists!" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcryptjs.hash(password, 10);
    console.log("token, ", fcmToken);
    // return;
    const tempUser = new TempUsers({
      username,
      email,
      password: hashedPassword,
      image: uploadUrl.secure_url,
      followers: followers || [],
      following: following || [],
      token,
      articles: articles || [],
      preferences: preferences || [],
      bio,
      fcmToken: fcmToken,
    });

    await tempUser.save();
    // Send confirmation email
    await sendConfirmationEmail(email, token);
    return res
      .status(201)
      .json({ message: "Confirmation email sent. Please verify your email." });
  } catch (error) {
    console.log("Error while creating user", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const ConfirmEmail = async (req, res) => {
  const { token } = req.query;
  // console.log("object", token);
  try {
    const tempUser = await TempUsers.findOne({ token });
    if (!tempUser) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Create the user in the main collection
    const user = new Users({
      username: tempUser?.username,
      email: tempUser?.email,
      password: tempUser?.password,
      image: tempUser?.image,
      followers: tempUser?.followers,
      following: tempUser?.following,
      articles: tempUser?.articles,
      token: tempUser?.token,
      preferences: tempUser?.preferences,
      bio: tempUser?.bio,
      fcmToken: tempUser?.fcmToken,
    });

    await user.save();

    // Remove the temp user
    await TempUsers.deleteOne({ token });

    return res.status(201).json({ message: "Email confirmed successfully!" });
  } catch (error) {
    console.log("Error while confirming email", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const UpdateUser = async (req, res) => {
  const { userId } = req.params;
  const { email, username } = req.body;
  try {
    const hashedPassword = await bcryptjs.hash(req.body.password, 10);
    const update_user = await Users.findByIdAndUpdate(
      userId,
      {
        username,
        email,
        password: hashedPassword,
      },
      {
        new: true,
      }
    );
    if (!update_user) {
      res.status(404).json({ message: "User not found!" });
    } else {
      return res.status(200).json(update_user);
    }
  } catch (error) {
    console.log("Error while creating account!" + error);
    return res.status(201).json("error is ", error.message);
  }
};

const DeleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await Users.findByIdAndDelete(userId);
    if (!user) {
      res.status(404).json({ message: "User not found!" });
    } else {
      res.status(200).json({ message: "User deleted successfully" });
    }
  } catch (error) {
    console.log("Error while deleting account!" + error);
    return res.status(201).json("error is ", error.message);
  }
};

const GetUsers = async (req, res) => {
  try {
    const users = await Users.find();
    return res.status(200).json(users);
  } catch (error) {
    console.log("Error while getting users!" + error);
  }
};

const LoginFunc = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please fill all fields" });
    }
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }
    // console.log("Plain password:", password);
    // console.log("Hashed password:", user.password);
    const isMatch = await bcryptjs.compare(password.trim(), user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      {
        userId: user?._id,
        email: user?.email,
        // just comment below line for clearness
        // follower: user?.followers,
        // following: user?.following,
      },
      process.env.SECRET_KEY,
      {
        expiresIn: "1d",
      }
    );
    return res
      .status(200)
      .json({ message: "User logged in successfully!", token, user });
  } catch (error) {
    console.log("Error during login ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const CreatePost = async (req, res) => {
  // console.log("req.user", req.user + title, description, imageUrl, category);
  try {
    const {
      title,
      description,
      imageUrl,
      category,
      authorImage,
      authorName,
      userId,
    } = req.body;
    // console.log(req.body);
    // return;
    const uploadUrl = await cloudinary.uploader.upload(imageUrl, {
      upload_preset: "my_preset",
    });
    // console.log(uploadUrl);
    const post = new Post({
      title,
      description,
      imageUrl: uploadUrl.secure_url,
      postedBy: req.user,
      category,
      authorImage,
      authorName,
    });

    const savedPost = await post.save();

    const users = await Users.findById(userId);
    const followerIds = users.followers;
    const followers = await Users.find({ _id: { $in: followerIds } });
    const fcmTokens = followers
      .map((follower) => follower.fcmToken)
      .filter(Boolean);

    console.log("users", fcmTokens);
    // return;

    const updatedUser = await Users.findByIdAndUpdate(
      req.user,
      { $push: { articles: savedPost._id } },
      { new: true }
    );
    return res.status(201).json({
      message: "Post created successfully",
      post: savedPost,
      user: updatedUser,
    });
  } catch (error) {
    console.log("Error while posting post ", error.message);
  }
};

const LikePost = async (req, res) => {
  const postId = req.params.postId;
  const userId = req.authUser.id;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.likes.includes(userId)) {
      const postUnlike = await Post.findByIdAndUpdate(
        postId,
        { $pull: { likes: userId } },
        { new: true }
      );
      return res
        .status(200)
        .json({ message: "Post unLiked successfully", postUnlike });
    } else {
      const postLiked = await Post.findByIdAndUpdate(
        postId,
        { $push: { likes: userId } },
        { new: true }
      );
      return res
        .status(200)
        .json({ message: "Post liked successfully", postLiked });
    }
  } catch (error) {
    console.log("Error while liking post ", error.message);
  }
};

const FollowUnFollow = async (req, res) => {
  const userId = req.authUser.id;
  const followId = req.params.userId;
  console.log("userId", userId, "followId", followId);
  // return;
  try {
    const user = await Users.findById(userId);
    const followUser = await Users.findById(followId);
    if (!user || !followUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.following.includes(followId)) {
      const userUnFollow = await Users.findByIdAndUpdate(
        userId,
        { $pull: { following: followId } },
        { new: true }
      );
      const followUserUnFollow = await Users.findByIdAndUpdate(
        followId,
        { $pull: { followers: userId } },
        { new: true }
      );
      return res.status(200).json({
        message: "User UnFollowed successfully",
        userUnFollow,
        followUserUnFollow,
      });
    } else {
      const userFollow = await Users.findByIdAndUpdate(
        userId,
        { $push: { following: followId } },
        { new: true }
      );
      const followUserFollow = await Users.findByIdAndUpdate(
        followId,
        { $push: { followers: userId } },
        { new: true }
      );
      return res.status(200).json({
        message: "User Followed successfully",
        userFollow,
        followUserFollow,
      });
    }
  } catch (error) {
    console.log("Error while following/unfollowing user ", error.message);
  }
};

const CommentOnPost = async (req, res) => {
  const postId = req.params.postId;
  const { commentText } = req.body;
  const user = req.authUser;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    post.comments.push({
      commentText: commentText,
      commentedBy: user?._id,
      commentedAt: new Date(),
    });
    await post.save();
    return res
      .status(200)
      .json({ message: "Comment added successfully", post });
  } catch (error) {
    console.log("Error while commenting on post ", error.message);
  }
};

const DeleteComment = async (req, res) => {
  const postId = req.params.postId;
  const comment_id = req.params.comment_id;
  const user = req.user;
  // console.log("user ", user);
  // return;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const comment = post.comments.find((comment) => comment._id == comment_id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    if (comment.commentedBy != user) {
      return res.status(403).json({
        error: "You are not authorized to delete this comment",
      });
    }
    post.comments = post.comments.filter(
      (comment) => comment._id != comment_id
    );
    await post.save();
    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.log("Error while deleting comment ", error.message);
  }
};

const GetRecommendedNews = async (req, res) => {
  const { userId } = req.query;
  try {
    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const recommendations = await Post.find({
      category: { $in: Users.preferences },
    }).sort({ date: -1 });
    return res.status(200).json(recommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const DeletePost = async (req, res) => {
  const { postId } = req.params;

  try {
    const isPostExist = await Post.findByIdAndDelete(postId);
    if (!isPostExist) {
      return res.status(422).json({ error: "Post does not exist" });
    }
    await Users.updateMany(
      { articles: postId }, // Find users with the postId in their articles
      { $pull: { articles: postId } } // Remove the postId from articles array
    );

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error while deleting post!");
  }
};

const UserDetails = async (req, res) => {
  const userId = req.params.userId;
  // console.log(userId);
  try {
    const isUser = await Users.findById(userId);
    if (!isUser) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ user: isUser });
  } catch (error) {
    console.log("Error while getting user information", error.message);
  }
};

const GetAllUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await Users.findById(userId)
      .populate("followers", "username email image") // Populate followers with their details
      .populate("following", "username email image"); // Populate following with their details

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      followers: user.followers,
      following: user.following,
    });
  } catch (error) {
    console.error("Error fetching followers and following", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const GetUserArticles = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await Users.findById(userId).populate("articles"); // Populate followers with their details

    if (!user) {
      return res.status(404).json({ error: "No user found!" });
    }

    return res.status(200).json({
      articles: user.articles,
    });
  } catch (error) {
    console.error("Error fetching user articles", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const TokenDetails = async (req, res) => {
  const userId = req.authUser;
  if (userId) {
    return res.json(userId);
  } else {
    return res.status(404).json({ message: "User not found" });
  }
};

const UpdatePost = async (req, res) => {
  const { postId } = req.params;
  try {
    await Post.findByIdAndUpdate(postId, req.body);
    return res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    console.log("Error while updating post ", error.message);
  }
};

const GetPosts = async (req, res) => {
  const { category } = req.query;
  // console.log(category);
  try {
    const filter = category ? { category } : {}; // No category fetches all
    const articles = await Post.find(filter);
    return res.status(200).json(articles);
  } catch (error) {
    console.log("Error while getting posts");
  }
};

const ReplyOnComment = async (req, res) => {
  const { postId, comment_id } = req.params;
  const { replyText } = req.body;
  const repliedBy = req.user;
  // console.log(
  //   "Post id is ",
  //   postId +
  //     " Comment id is " +
  //     comment_id +
  //     " Reply text is " +
  //     replyText +
  //     "Replied by " +
  //     repliedBy
  // );
  // return;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const comment = post.comments.id(comment_id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    comment.commentReplies.push({
      replyText,
      repliedBy,
    });
    await post.save();
    return res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const DeleteReplyComment = async (req, res) => {
  const { postId, comment_id, replyId } = req.params;
  const repliedBy = req.user;
  // console.log("Post id is ",postId +" C omment id is " + comment_id + " Replied by " + repliedBy + " reply id is " + replyId);

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const comment = post.comments.id(comment_id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    const reply = comment.commentReplies.id(replyId);
    console.log("reply is " + reply);
    if (!reply) {
      return res.status(404).json({ error: "Reply not found" });
    }
    if (reply.repliedBy.toString() !== repliedBy.toString()) {
      return res.status(401).json({ error: "Unauthorized" });
    } else {
      comment.commentReplies.remove({
        replyId,
      });
      await post.save();
      return res
        .status(200)
        .json({ message: "Comment reply deleted successfully" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

const GetLatestNews = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(10);
    return res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  AdminLogin,
  LoginFunc,
  EmptyPage,
  User,
  UpdateUser,
  DeleteUser,
  GetUsers,
  CreatePost,
  DeletePost,
  UpdatePost,
  GetPosts,
  LikePost,
  CommentOnPost,
  UserDetails,
  DeleteComment,
  ReplyOnComment,
  DeleteReplyComment,
  TokenDetails,
  ConfirmEmail,
  FollowUnFollow,
  GetRecommendedNews,
  GetAllUser,
  GetUserArticles,
  GetLatestNews,
  SendNotify,
  SendNotificationToFollowers,
};
