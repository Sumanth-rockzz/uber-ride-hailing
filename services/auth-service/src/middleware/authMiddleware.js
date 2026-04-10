const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) throw new Error("No token");

    const decoded = jwt.verify(token, jwtConfig.secret);

    req.user = decoded;

    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = authMiddleware;