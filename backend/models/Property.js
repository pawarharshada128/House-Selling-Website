const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC PROPERTY INFORMATION
    // =====================================================

    title: {
      type: String,
      required: true,
    },

    property_type: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    bedrooms: {
      type: Number,
      default: 0,
    },

    bathrooms: {
      type: Number,
      default: 0,
    },

    area_sqft: {
      type: Number,
      default: 0,
    },

    description: {
      type: String,
      default: "",
    },

    // =====================================================
    // MAIN IMAGE
    // =====================================================

    image: {
      type: String,
      default: "",
    },

    // =====================================================
    // ADDITIONAL IMAGES
    // =====================================================

    images: {
      type: [String],
      default: [],
    },

    // =====================================================
    // PROPERTY VIDEO
    // =====================================================

    video: {
      type: String,
      default: "",
    },

    // =====================================================
    // GOOGLE MAP
    // =====================================================

    map_location: {
      type: String,
      default: "",
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    // =====================================================
    // STATUS
    // =====================================================

    status: {
      type: String,

      enum: [
        "Pending",
        "Available",
        "Sold",
        "Rejected",
      ],

      default: "Pending",
    },

    // =====================================================
    // OWNER
    // =====================================================

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // =====================================================
    // FEATURED
    // =====================================================

    featured: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Property",
  propertySchema
);