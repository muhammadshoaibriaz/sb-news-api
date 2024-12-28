const jwt = require("jsonwebtoken");
const Users = require("../models/User");

const auth = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Token not found unauthorized user" });
    }
    token = token.split(" ")[1];
    console.log("Received token:", token);
    let user = jwt.verify(token, process.env.SECRET_KEY);
    req.user = user.userId;
    // console.log("user", user);
    const authUser = await Users.findById(user.userId);
    // console.log(authUser);
    req.authUser = await Users.findOne({ _id: user.userId });
    next();
  } catch (error) {
    // console.log("Unauthorized user ", error.message);
    return res.status(401).json({ message: "Unauthorized user!" });
  }
};

module.exports = auth;
