const mongoose = require("mongoose");
const crypto = require("crypto");

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },
    enquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enquiry",
      required: true,
      unique: true,
      sparse: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    propertyPrice: {
      type: Number,
      required: true,
    },

    advanceAmount: {
      type: Number,
      required: true,
    },

    finalAmount: {
      type: Number,
      required: true,
    },
    agreedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    verifiedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    advancePaymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },

    finalPaymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },

    bookingStatus: {
      type: String,
      enum: [
        "Pending",
        "Pending Payment",
        "Partially Paid",
        "Fully Paid",
        "Confirmed",
        "Cancelled",
        "Completed",
      ],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.pre("validate", function () {
  if (!this.bookingReference) {
    this.bookingReference = `SKB-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  }
});

module.exports = mongoose.model("Booking", bookingSchema);