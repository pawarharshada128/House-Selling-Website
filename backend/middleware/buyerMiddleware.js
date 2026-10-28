const mongoose = require("mongoose");
const User = require("../models/User");

const buyerMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "buyer" || !mongoose.Types.ObjectId.isValid(req.user.id)) {
    return res.status(403).json({
      message: "Only customer accounts can submit or view their enquiries.",
    });
  }

  User.findById(req.user.id)
    .select("role")
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          message: "Customer account could not be verified.",
        });
      }

      if (user.role !== "buyer") {
        return res.status(403).json({
          message: "Only customer accounts can submit or view their enquiries.",
        });
      }

      next();
    })
    .catch((error) => {
      console.error("Verify customer role error:", error);
      res.status(500).json({
        message: "Unable to verify customer permissions.",
      });
    });
};

module.exports = buyerMiddleware;
