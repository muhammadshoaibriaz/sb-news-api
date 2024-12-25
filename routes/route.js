const express = require("express");
const {
  EmptyPage,
  User,
  LoginFunc,
  CreatePost,
  GetPosts,
  LikePost,
  CommentOnPost,
  UpdatePost,
  UpdateUser,
  DeleteUser,
  GetUsers,
  DeletePost,
  AdminLogin,
  UserDetails,
  DeleteComment,
  ReplyOnComment,
  DeleteReplyComment,
  TokenDetails,
  ConfirmEmail,
} = require("../controllers/controller");
const auth = require("../middlewares/auth");
const {
  authMiddleWare,
  userAuthMiddleware,
} = require("../middlewares/authMiddleware");

const router = express.Router();
router.route("/").get(EmptyPage);
router.route("/api/admin_login").post(AdminLogin);
router.route("/api/login").post(LoginFunc);
router.route("/api/register").post(User);
router.route("/api/confirm-email").get(ConfirmEmail);
router.route("/api/register/:userId").get(UserDetails);
router.route("/api/register").get(auth, TokenDetails);
router.route("/api/get_users").get(GetUsers);
router.route("/api/register/:userId").put(UpdateUser);
router.route("/api/register/:userId").delete(DeleteUser);
router.route("/api/post").post(auth, CreatePost);

router
  .route("/api/post/:postId")
  .delete(auth, authMiddleWare(["admin"]), DeletePost);

router.route("/api/post/:postId").put(auth, UpdatePost);
router.route("/api/post/:postId/like-unlike").patch(auth, LikePost);
router.route("/api/post/:postId/comment").patch(auth, CommentOnPost);
router
  .route("/api/post/:postId/:comment_id/delete-comment")
  .delete(auth, DeleteComment);

router
  .route("/api/post/:postId/:comment_id/reply_on_comment")
  .patch(auth, ReplyOnComment);

router
  .route("/api/post/:postId/:comment_id/:replyId/delete_reply_comment")
  .delete(auth, DeleteReplyComment);

router.route("/api/posts").get(GetPosts);

module.exports = router;
