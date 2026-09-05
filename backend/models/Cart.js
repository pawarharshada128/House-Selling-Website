const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    totalPayment: {
      type: Number,
      required: true,
    },

    advancePayment: {
      type: Number,
      required: true,
    },

    remainingPayment: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Same property should not be added twice for same user
cartSchema.index(
  { user: 1, property: 1 },
  { unique: true }
);

module.exports = mongoose.model("Cart", cartSchema);