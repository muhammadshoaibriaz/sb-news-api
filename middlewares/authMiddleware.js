const authMiddleWare = () => {
  return (req, res, next) => {
    if (req.authUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "You are not allowed to perform this action" });
    }

    next();
  };
};

const userAuthMiddleware = () => {
  return (req, res, next) => {
    if (req.authUser.role == "user") {
      next();
      return;
    }
    return res
      .status(403)
      .json({ message: "You are not allowed to perform this action fdsaf" });
  };
};
module.exports = { authMiddleWare, userAuthMiddleware };
