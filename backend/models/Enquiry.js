const mongoose = require("mongoose");

const siteVisitSchema = new mongoose.Schema(
  {
    scheduledAt: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    visitType: {
      type: String,
      enum: ["Property Visit", "Land Inspection"],
      default: "Property Visit",
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
  },
  { timestamps: true }
);

const quotationSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    amount: {
      type: Number,
      min: 0,
      required: true,
    },
    materialCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    labourCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    additionalCharges: {
      type: Number,
      min: 0,
      default: 0,
    },
    quotedAt: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      default: null,
    },
    details: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    status: {
      type: String,
      enum: ["Draft", "Sent", "Accepted", "Rejected"],
      default: "Draft",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const propertyOfferSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    amount: {
      type: Number,
      min: 0,
      required: true,
    },
    discountAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    validUntil: {
      type: Date,
      default: null,
    },
    details: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    status: {
      type: String,
      enum: ["Draft", "Sent", "Accepted", "Rejected"],
      default: "Draft",
    },
    customerResponse: {
      type: String,
      enum: ["Accepted", "Rejected", null],
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const progressUpdateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    targetCompletionDate: {
      type: Date,
      default: null,
    },
    actualCompletionDate: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    updateDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Planned", "In Progress", "Completed"],
      default: "Planned",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    previousStatus: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  { _id: false }
);

const enquirySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    propertyTitle: {
      type: String,
      default: "",
    },

    requestType: {
      type: String,
      enum: ["PropertyBooking", "BuildRequest", "General"],
    },

    type: {
      type: String,
      enum: ["PropertyBooking", "BuildRequest", "General"],
    },

    buildDetails: {
      landLocation: { type: String, trim: true, maxlength: 200, default: "" },
      plotArea: { type: String, trim: true, maxlength: 80, default: "" },
      homeType: { type: String, trim: true, maxlength: 100, default: "" },
      homeSize: { type: String, trim: true, maxlength: 100, default: "" },
      floors: { type: String, trim: true, maxlength: 40, default: "" },
      bedrooms: { type: String, trim: true, maxlength: 40, default: "" },
      budget: { type: String, trim: true, maxlength: 100, default: "" },
      preferredDesign: { type: String, trim: true, maxlength: 200, default: "" },
      additionalRequirements: { type: String, trim: true, maxlength: 2000, default: "" },
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "New",
        "Contacted",
        "Visit Scheduled",
        "Offer Made",
        "Offer Accepted",
        "Offer Rejected",
        "Booking in Progress",
        "Booking Confirmed",
        "Site Visit Scheduled",
        "Quotation in Preparation",
        "Quotation Sent",
        "Approved",
        "In Progress",
        "Completed",
        "Rejected",
        "Cancelled",
        "Closed",
      ],
      default: "Pending",
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    adminNotes: {
      type: [
        {
          note: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
          },
          createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },

    siteVisits: {
      type: [siteVisitSchema],
      default: [],
    },

    propertyOffer: {
      type: propertyOfferSchema,
      default: undefined,
    },

    quotation: {
      type: quotationSchema,
      default: undefined,
    },

    progressUpdates: {
      type: [progressUpdateSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Enquiry", enquirySchema);