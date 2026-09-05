const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      default: "Customer",
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },

    image: {
      type: String,
      default: "",
    },
    images: {
  type: [String],
  default: []
},

video: {
  type: String,
  default: ""
},

map_location: {
  type: String,
  default: ""
},

latitude: {
  type: Number,
  default: null
},

longitude: {
  type: Number,
  default: null
},

    approved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Testimonial",
  testimonialSchema
);