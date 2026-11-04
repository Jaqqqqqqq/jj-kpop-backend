const jwt = require("jsonwebtoken");
const User = require("../models/user");

async function adminOnly(req, res, next) {
  const authorization = req.headers.authorization;
  const token = req.cookies?.token || (authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Please log in as an admin",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "jj-kpop-development-secret-change-before-deploy"
    );
    const user = await User.findById(decoded.id).select("_id role isActive");

    if (!user || user.isActive === false) {
      return res.status(401).json({ success: false, message: "Your account is unavailable. Please log in again." });
    }

    if (String(user.role).toLowerCase() !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

module.exports = adminOnly;
