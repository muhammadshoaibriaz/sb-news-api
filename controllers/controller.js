const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Post = require("../models/Post");
const Users = require("../models/User");
const Admin = require("../models/Admin");
const Like = require("../models/LikeSchema");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const TempUsers = require("../models/TempUser");

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
  // console.log(confirmationLink);
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Email Confirmation",
    text: `Click the link to confirm your email: ${confirmationLink}`,
  };

  return await transporter.sendMail(mailOptions);
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
    res.status(200).json({ message: "Admin logged in", token, admin });
  } catch (error) {
    console.log("Error while logging in", error.message);
  }
};

const User = async (req, res) => {
  const { username, email, password, image, followers, following, articles } =
    req.body;

  try {
    const isExist = await Users.findOne({ email });
    if (isExist) {
      return res.status(200).json({ error: "User already exists!" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcryptjs.hash(password, 10);
    // console.log("token, ", token);

    // Store the user in a temporary collection with the token
    const tempUser = new TempUsers({
      username,
      email,
      password: hashedPassword,
      image: image || "",
      followers: followers || [],
      following: following || [],
      token,
      articles: articles || [],
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
      username: tempUser.username,
      email: tempUser.email,
      password: tempUser.password,
      image: tempUser.image,
      followers: tempUser.followers,
      following: tempUser.following,
      articles: tempUser.articles,
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
  // console.log(req.body);
  // return;
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please fill all fields" });
    }
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
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
    res
      .status(200)
      .json({ message: "User logged in successfully!", token, user });
  } catch (error) {
    console.log("Error during login ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const CreatePost = async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body;
    // console.log("req.user", req.user);
    const post = new Post({
      title,
      description,
      imageUrl,
      postedBy: req.user,
    });

    await post.save();
    return res
      .status(201)
      .json({ message: "Post created successfully", user: req.user });
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

const DeletePost = async (req, res) => {
  const { postId } = req.params;
  try {
    const isPostExist = await Post.findByIdAndDelete(postId);
    if (!isPostExist) {
      return res.status(422).json({ error: "Post does not exist" });
    }
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
  try {
    const getPosts = await Post.find();
    return res.status(200).json(getPosts);
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
    res.status(200).json(post);
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
};
