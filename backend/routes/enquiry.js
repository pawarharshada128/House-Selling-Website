const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Enquiry = require("../models/Enquiry");
const Property = require("../models/Property");
const User = require("../models/User");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const buyerMiddleware = require("../middleware/buyerMiddleware");

const CUSTOMER_VISIBLE_RECORD_STATUSES = new Set(["Sent", "Accepted", "Rejected"]);

const toCustomerEnquiry = (enquiry) => {
  const customerEnquiry = enquiry.toObject();
  delete customerEnquiry.adminNotes;

  if (
    customerEnquiry.propertyOffer &&
    !CUSTOMER_VISIBLE_RECORD_STATUSES.has(customerEnquiry.propertyOffer.status)
  ) {
    delete customerEnquiry.propertyOffer;
  }
  if (
    customerEnquiry.quotation &&
    !CUSTOMER_VISIBLE_RECORD_STATUSES.has(customerEnquiry.quotation.status)
  ) {
    delete customerEnquiry.quotation;
  }

  return customerEnquiry;
};

const resolveRequestType = (enquiry) => {
  const explicitType = enquiry.requestType || enquiry.type;

  if (explicitType === "BuildRequest" || explicitType === "PropertyBooking") {
    return explicitType;
  }

  const title = String(enquiry.propertyTitle || "").toLowerCase();
  const message = String(enquiry.message || "").toLowerCase();

  if (
    title.includes("build on your land") ||
    title.includes("build your dream home") ||
    message.startsWith("build on your land request") ||
    message.startsWith("build your dream home request")
  ) {
    return "BuildRequest";
  }

  return enquiry.propertyId ? "PropertyBooking" : "General";
};

const validateBuildDetails = (details) => {
  const limits = {
    landLocation: 200,
    plotArea: 80,
    homeType: 100,
    homeSize: 100,
    floors: 40,
    bedrooms: 40,
    budget: 100,
    preferredDesign: 200,
    additionalRequirements: 2000,
  };

  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return "Construction requirements must be an object.";
  }

  for (const [field, maxLength] of Object.entries(limits)) {
    if (
      details[field] !== undefined &&
      (typeof details[field] !== "string" || details[field].length > maxLength)
    ) {
      return `${field} must be a string of ${maxLength} characters or fewer.`;
    }
  }

  if (!String(details.landLocation || "").trim()) {
    return "Land location is required for a build request.";
  }

  return null;
};

const validateMoneyRecord = (record, label) => {
  const {
    amount,
    details = "",
    status = "Draft",
    title = "",
    reference = "",
    discountAmount = 0,
    discountPercent = 0,
    materialCost = 0,
    labourCost = 0,
    additionalCharges = 0,
    validUntil,
    quotedAt,
  } = record || {};

  if (
    amount === undefined ||
    amount === null ||
    amount === "" ||
    !Number.isFinite(Number(amount)) ||
    Number(amount) < 0
  ) {
    return `${label} amount must be a valid non-negative number.`;
  }
  if (typeof details !== "string" || details.length > 2000) {
    return `${label} details must be 2000 characters or fewer.`;
  }
  if (typeof title !== "string" || title.length > 120) {
    return `${label} title must be 120 characters or fewer.`;
  }
  if (typeof reference !== "string" || reference.length > 80) {
    return `${label} reference must be 80 characters or fewer.`;
  }
  for (const [field, value] of Object.entries({
    discountAmount,
    discountPercent,
    materialCost,
    labourCost,
    additionalCharges,
  })) {
    if (!Number.isFinite(Number(value)) || Number(value) < 0) {
      return `${field} must be a non-negative number.`;
    }
  }
  if (Number(discountPercent) > 100) {
    return "Discount percentage must not exceed 100.";
  }
  if (validUntil && Number.isNaN(Date.parse(validUntil))) {
    return `${label} validity date is invalid.`;
  }
  if (quotedAt && Number.isNaN(Date.parse(quotedAt))) {
    return "Quotation date is invalid.";
  }
  if (!["Draft", "Sent", "Accepted", "Rejected"].includes(status)) {
    return `Invalid ${label.toLowerCase()} status.`;
  }

  return null;
};

// =====================================================
// CREATE ENQUIRY
// Authenticated customers only
// =====================================================

router.post("/", authMiddleware, buyerMiddleware, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      message,
      propertyId,
      propertyTitle,
      requestType: requestedType,
      type,
      buildDetails,
    } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !message.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      !/^[+\d\s().-]{7,30}$/.test(phone.trim()) ||
      name.length > 100 ||
      email.length > 254 ||
      phone.length > 30 ||
      message.length > 5000 ||
      (propertyTitle !== undefined &&
        (typeof propertyTitle !== "string" || propertyTitle.length > 200))
    ) {
      return res.status(400).json({
        message: "Please provide valid name, email, phone, and message details.",
      });
    }

    const requestType = requestedType || type;
    const isBuildRequest =
      requestType === "BuildRequest" ||
      String(propertyTitle || "").toLowerCase().includes("build");
    const resolvedRequestType =
      requestType ||
      (propertyId
        ? "PropertyBooking"
        : isBuildRequest
          ? "BuildRequest"
          : "General");

    if (!["PropertyBooking", "BuildRequest", "General"].includes(resolvedRequestType)) {
      return res.status(400).json({
        message: "Invalid enquiry type.",
      });
    }

    if (resolvedRequestType === "BuildRequest") {
      const detailsError = validateBuildDetails(buildDetails);
      if (detailsError) {
        return res.status(400).json({ message: detailsError });
      }
    }

    if (propertyId && !mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        message: "Invalid property ID.",
      });
    }
    if (propertyId) {
      const property = await Property.findOne({
        _id: propertyId,
        status: "Available",
      }).select("_id");
      if (!property) {
        return res.status(409).json({
          message: "This property is no longer available.",
        });
      }
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(401).json({
        message: "Invalid authenticated customer.",
      });
    }

    const customer = await User.findById(req.user.id).select("name email role");
    if (!customer || customer.role !== "buyer") {
      return res.status(401).json({
        message: "Customer account could not be verified.",
      });
    }

    const enquiry = new Enquiry({
      customerId: customer._id,
      name: customer.name,
      email: customer.email,
      phone,
      message,
      propertyId: propertyId || null,
      propertyTitle: propertyTitle || "",
      requestType: resolvedRequestType,
      status: "Pending",
      statusHistory: [{
        previousStatus: "",
        status: "Pending",
        changedBy: customer._id,
        remarks: "Enquiry submitted.",
      }],
      ...(resolvedRequestType === "BuildRequest" && buildDetails
        ? { buildDetails }
        : {}),
    });

    await enquiry.save();

    res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully.",
      enquiry,
      referenceId: enquiry._id,
    });
  } catch (error) {
    console.error("Create enquiry error:", error);

    res.status(500).json({
      message: "Failed to submit enquiry.",
    });
  }
});

// =====================================================
// GET THE AUTHENTICATED CUSTOMER'S ENQUIRIES
// =====================================================

router.get("/mine", authMiddleware, buyerMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(401).json({
        message: "Invalid authenticated customer.",
      });
    }

    const enquiries = await Enquiry.find({
      customerId: req.user.id,
    })
      .populate("propertyId", "title location price image images description property_type")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      enquiries: enquiries.map(toCustomerEnquiry),
    });
  } catch (error) {
    console.error("Get customer enquiries error:", error);

    res.status(500).json({
      message: "Failed to load your enquiries.",
    });
  }
});

router.patch(
  "/:id/property-offer-response",
  authMiddleware,
  buyerMiddleware,
  async (req, res) => {
    try {
      const { response } = req.body || {};
      if (!["Accepted", "Rejected"].includes(response)) {
        return res.status(400).json({
          message: "Choose Accepted or Rejected.",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid enquiry ID." });
      }
      const enquiry = await Enquiry.findOne({
        _id: req.params.id,
        customerId: req.user.id,
        requestType: "PropertyBooking",
        "propertyOffer.status": "Sent",
        bookingId: null,
      });
      if (!enquiry) {
        return res.status(409).json({
          message: "No response-ready offer was found for this enquiry.",
        });
      }
      if (
        enquiry.propertyOffer.validUntil &&
        new Date(enquiry.propertyOffer.validUntil) < new Date()
      ) {
        return res.status(409).json({ message: "This offer has expired." });
      }
      const previousStatus = enquiry.status;
      enquiry.propertyOffer.status = response;
      enquiry.propertyOffer.updatedAt = new Date();
      enquiry.status = response === "Accepted" ? "Offer Accepted" : "Offer Rejected";
      enquiry.statusHistory.push({
        previousStatus,
        status: enquiry.status,
        changedBy: req.user.id,
        remarks: `Customer ${response.toLowerCase()} the property offer.`,
      });
      const updated = await Enquiry.findOneAndUpdate(
        {
          _id: enquiry._id,
          customerId: req.user.id,
          "propertyOffer.status": "Sent",
          bookingId: null,
        },
        {
          $set: {
            "propertyOffer.status": response,
            "propertyOffer.customerResponse": response,
            "propertyOffer.respondedAt": enquiry.propertyOffer.updatedAt,
            "propertyOffer.respondedBy": req.user.id,
            "propertyOffer.updatedAt": enquiry.propertyOffer.updatedAt,
            status: enquiry.status,
          },
          $push: {
            statusHistory: {
              previousStatus,
              status: enquiry.status,
              changedBy: req.user.id,
              remarks: `Customer ${response.toLowerCase()} the property offer.`,
            },
          },
        },
        { new: true }
      );
      if (!updated) {
        return res.status(409).json({
          message: "This offer has already received a response.",
        });
      }
      await updated.populate(
        "propertyId",
        "title location price image images description property_type"
      );
      res.json({
        success: true,
        message: `Offer ${response.toLowerCase()}.`,
        enquiry: toCustomerEnquiry(updated),
      });
    } catch (error) {
      console.error("Property offer response error:", error);
      res.status(500).json({ message: "Failed to save offer response." });
    }
  }
);

// =====================================================
// GET A CUSTOMER'S OWN ENQUIRY
// =====================================================

router.get("/:id", authMiddleware, buyerMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid enquiry ID.",
      });
    }

    const enquiry = await Enquiry.findOne({
      _id: req.params.id,
      customerId: req.user.id,
    })
      .populate("propertyId", "title location price image images description property_type");

    if (!enquiry) {
      return res.status(404).json({
        message: "Enquiry not found.",
      });
    }

    res.json({
      success: true,
      enquiry: toCustomerEnquiry(enquiry),
    });
  } catch (error) {
    console.error("Get customer enquiry error:", error);

    res.status(500).json({
      message: "Failed to load enquiry details.",
    });
  }
});

// =====================================================
// GET ALL ENQUIRIES
// Admin only
// =====================================================

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const enquiries = await Enquiry.find()
        .populate("propertyId", "title location price image images description property_type")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        enquiries,
      });
    } catch (error) {
      console.error("Get enquiries error:", error);

      res.status(500).json({
        message: "Failed to load enquiries.",
      });
    }
  }
);

// =====================================================
// UPDATE ENQUIRY STATUS
// Admin only
// =====================================================

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const allowedFields = new Set([
        "status",
        "statusRemark",
        "adminNote",
        "siteVisit",
        "siteVisitUpdate",
        "propertyOffer",
        "quotation",
        "progressUpdate",
      ]);
      const updates = req.body || {};
      const invalidField = Object.keys(updates).find(
        (field) => !allowedFields.has(field)
      );

      if (invalidField) {
        return res.status(400).json({
          message: `Unsupported enquiry update: ${invalidField}.`,
        });
      }

      if (!Object.keys(updates).length) {
        return res.status(400).json({
          message: "At least one enquiry update is required.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid enquiry ID.",
        });
      }

      const enquiry = await Enquiry.findById(req.params.id);

      if (!enquiry) {
        return res.status(404).json({
          message: "Enquiry not found.",
        });
      }

      const requestType = resolveRequestType(enquiry);
      if (enquiry.bookingId && updates.propertyOffer) {
        return res.status(409).json({
          message: "An accepted offer cannot be changed after booking initiation.",
        });
      }
      if (
        enquiry.bookingId &&
        Object.prototype.hasOwnProperty.call(updates, "status") &&
        ["Rejected", "Cancelled", "Closed"].includes(updates.status)
      ) {
        return res.status(409).json({
          message: "Manage this enquiry through its active booking instead.",
        });
      }
      const allowedStatuses = requestType === "BuildRequest"
        ? new Set([
            "Pending",
            "New",
            "Contacted",
            "Site Visit Scheduled",
            "Quotation in Preparation",
            "Quotation Sent",
            "Approved",
            "In Progress",
            "Completed",
            "Rejected",
            "Cancelled",
            "Closed",
          ])
        : new Set([
            "Pending",
            "New",
            "Contacted",
            "Visit Scheduled",
            "Offer Made",
            "Offer Accepted",
            "Offer Rejected",
            "Booking in Progress",
            "Booking Confirmed",
            "Closed",
            "Cancelled",
            "Site Visit Scheduled",
            "Quotation Sent",
            "In Progress",
            "Completed",
            "Rejected",
          ]);

      if (
        Object.prototype.hasOwnProperty.call(updates, "status") &&
        !allowedStatuses.has(updates.status)
      ) {
        return res.status(400).json({
          message: "Invalid enquiry status.",
        });
      }

      if (updates.status === "Booking Confirmed") {
        return res.status(409).json({
          message: "Confirm this enquiry through its eligible booking.",
        });
      }

      if (
        updates.statusRemark !== undefined &&
        (typeof updates.statusRemark !== "string" || updates.statusRemark.length > 1000)
      ) {
        return res.status(400).json({
          message: "Status remarks must be 1000 characters or fewer.",
        });
      }

      if (
        updates.adminNote !== undefined &&
        (typeof updates.adminNote !== "string" ||
          !updates.adminNote.trim() ||
          updates.adminNote.length > 1000)
      ) {
        return res.status(400).json({
          message: "Admin notes must contain 1 to 1000 characters.",
        });
      }

      if (Object.prototype.hasOwnProperty.call(updates, "siteVisit")) {
        const {
          scheduledAt,
          notes = "",
          location = "",
          instructions = "",
          visitType = requestType === "BuildRequest" ? "Land Inspection" : "Property Visit",
        } = updates.siteVisit || {};
        if (!scheduledAt || Number.isNaN(Date.parse(scheduledAt))) {
          return res.status(400).json({
            message: "A valid site visit date and time are required.",
          });
        }
        if (Date.parse(scheduledAt) <= Date.now()) {
          return res.status(400).json({
            message: "Site visit must be scheduled for a future date and time.",
          });
        }
        if (typeof notes !== "string" || notes.length > 1000) {
          return res.status(400).json({
            message: "Site visit notes must be 1000 characters or fewer.",
          });
        }
        if (typeof location !== "string" || location.length > 300) {
          return res.status(400).json({
            message: "Site visit location must be 300 characters or fewer.",
          });
        }
        if (typeof instructions !== "string" || instructions.length > 1000) {
          return res.status(400).json({
            message: "Site visit instructions must be 1000 characters or fewer.",
          });
        }
        if (!["Property Visit", "Land Inspection"].includes(
          updates.siteVisit.visitType ||
            (requestType === "BuildRequest" ? "Land Inspection" : "Property Visit")
        )) {
          return res.status(400).json({
            message: "Invalid site visit type.",
          });
        }
        if (!["Property Visit", "Land Inspection"].includes(visitType)) {
          return res.status(400).json({
            message: "Invalid site visit type.",
          });
        }
      }

      if (Object.prototype.hasOwnProperty.call(updates, "siteVisitUpdate")) {
        const { visitId, status, scheduledAt, notes, location, instructions } =
          updates.siteVisitUpdate || {};
        if (!mongoose.Types.ObjectId.isValid(visitId)) {
          return res.status(400).json({
            message: "Invalid site visit ID.",
          });
        }
        if (status !== undefined && !["Scheduled", "Completed", "Cancelled"].includes(status)) {
          return res.status(400).json({
            message: "Invalid site visit status.",
          });
        }
        if (scheduledAt !== undefined && Number.isNaN(Date.parse(scheduledAt))) {
          return res.status(400).json({
            message: "A valid site visit date and time are required.",
          });
        }
        if (notes !== undefined && (typeof notes !== "string" || notes.length > 1000)) {
          return res.status(400).json({
            message: "Site visit notes must be 1000 characters or fewer.",
          });
        }
        if (location !== undefined && (typeof location !== "string" || location.length > 300)) {
          return res.status(400).json({
            message: "Site visit location must be 300 characters or fewer.",
          });
        }
        if (instructions !== undefined && (typeof instructions !== "string" || instructions.length > 1000)) {
          return res.status(400).json({
            message: "Site visit instructions must be 1000 characters or fewer.",
          });
        }
      }

      if (Object.prototype.hasOwnProperty.call(updates, "propertyOffer")) {
        if (requestType !== "PropertyBooking") {
          return res.status(400).json({
            message: "Property offers are only available for property enquiries.",
          });
        }
        const offerError = validateMoneyRecord(updates.propertyOffer, "Offer");
        if (offerError) {
          return res.status(400).json({ message: offerError });
        }
      }

      if (Object.prototype.hasOwnProperty.call(updates, "quotation")) {
        if (requestType !== "BuildRequest") {
          return res.status(400).json({
            message: "Construction quotations are only available for build requests.",
          });
        }
        const quotationError = validateMoneyRecord(updates.quotation, "Quotation");
        if (quotationError) {
          return res.status(400).json({ message: quotationError });
        }
      }

      if (Object.prototype.hasOwnProperty.call(updates, "progressUpdate")) {
        if (requestType !== "BuildRequest") {
          return res.status(400).json({
            message: "Construction progress is only available for build requests.",
          });
        }
        const {
          title,
          description = "",
          progress = 0,
          status = "Planned",
          updateDate = new Date(),
          startDate,
          targetCompletionDate,
          actualCompletionDate,
          remarks = "",
        } = updates.progressUpdate || {};
        if (typeof title !== "string" || !title.trim() || title.length > 120) {
          return res.status(400).json({
            message: "A progress update title of 120 characters or fewer is required.",
          });
        }
        if (typeof description !== "string" || description.length > 1000) {
          return res.status(400).json({
            message: "Progress update details must be 1000 characters or fewer.",
          });
        }
        if (
          progress === "" ||
          !Number.isFinite(Number(progress)) ||
          Number(progress) < 0 ||
          Number(progress) > 100
        ) {
          return res.status(400).json({
            message: "Progress must be between 0 and 100.",
          });
        }
        if (!["Planned", "In Progress", "Completed"].includes(status)) {
          return res.status(400).json({
            message: "Invalid construction progress status.",
          });
        }
        if (!updateDate || Number.isNaN(Date.parse(updateDate))) {
          return res.status(400).json({
            message: "A valid progress update date is required.",
          });
        }
        for (const [label, value] of [
          ["Start date", startDate],
          ["Target completion date", targetCompletionDate],
          ["Actual completion date", actualCompletionDate],
        ]) {
          if (value && Number.isNaN(Date.parse(value))) {
            return res.status(400).json({
              message: `${label} is invalid.`,
            });
          }
        }
        if (typeof remarks !== "string" || remarks.length > 1000) {
          return res.status(400).json({
            message: "Milestone remarks must be 1000 characters or fewer.",
          });
        }
      }

      if (Object.prototype.hasOwnProperty.call(updates, "status")) {
        if (enquiry.status !== updates.status) {
          enquiry.statusHistory.push({
            previousStatus: enquiry.status,
            status: updates.status,
            changedBy: req.user.id,
            remarks: updates.statusRemark || "",
          });
        }
        enquiry.status = updates.status;
        if (["Rejected", "Cancelled", "Closed"].includes(updates.status)) {
          enquiry.siteVisits.forEach((visit) => {
            if (visit.status === "Scheduled") {
              visit.status = "Cancelled";
            }
          });
        }
      }
      if (updates.adminNote) {
        enquiry.adminNotes.push({
          note: updates.adminNote.trim(),
          createdBy: req.user.id,
        });
      }
      if (updates.siteVisit) {
        enquiry.siteVisits.push({
          scheduledAt: new Date(updates.siteVisit.scheduledAt),
          notes: updates.siteVisit.notes || "",
          location: updates.siteVisit.location || "",
          instructions: updates.siteVisit.instructions || "",
          visitType:
            updates.siteVisit.visitType ||
            (requestType === "BuildRequest" ? "Land Inspection" : "Property Visit"),
        });
      }
      if (updates.siteVisitUpdate) {
        const { visitId, ...visitUpdates } = updates.siteVisitUpdate;
        const visit = enquiry.siteVisits.id(visitId);
        if (!visit) {
          return res.status(404).json({
            message: "Site visit not found.",
          });
        }
        const nextStatus = visitUpdates.status || visit.status;
        const nextScheduledAt = visitUpdates.scheduledAt
          ? new Date(visitUpdates.scheduledAt)
          : visit.scheduledAt;
        if (
          nextStatus === "Scheduled" &&
          (visitUpdates.status !== undefined || visitUpdates.scheduledAt !== undefined) &&
          nextScheduledAt <= Date.now()
        ) {
          return res.status(400).json({
            message: "Site visit must be scheduled for a future date and time.",
          });
        }
        if (visitUpdates.scheduledAt !== undefined) {
          visit.scheduledAt = nextScheduledAt;
        }
        for (const field of ["status", "notes", "location", "instructions"]) {
          if (visitUpdates[field] !== undefined) {
            visit[field] = visitUpdates[field];
          }
        }
      }
      if (updates.propertyOffer) {
        enquiry.propertyOffer = {
          ...updates.propertyOffer,
          amount: Number(updates.propertyOffer.amount),
          updatedAt: new Date(),
        };
      }
      if (updates.quotation) {
        enquiry.quotation = {
          ...updates.quotation,
          amount: Number(updates.quotation.amount),
          materialCost: Number(updates.quotation.materialCost || 0),
          labourCost: Number(updates.quotation.labourCost || 0),
          additionalCharges: Number(updates.quotation.additionalCharges || 0),
          quotedAt: updates.quotation.quotedAt
            ? new Date(updates.quotation.quotedAt)
            : new Date(),
          validUntil: updates.quotation.validUntil
            ? new Date(updates.quotation.validUntil)
            : null,
          updatedAt: new Date(),
        };
      }
      if (updates.progressUpdate) {
        enquiry.progressUpdates.push({
          ...updates.progressUpdate,
          progress: Number(updates.progressUpdate.progress || 0),
          updateDate: new Date(updates.progressUpdate.updateDate || Date.now()),
          startDate: updates.progressUpdate.startDate
            ? new Date(updates.progressUpdate.startDate)
            : null,
          targetCompletionDate: updates.progressUpdate.targetCompletionDate
            ? new Date(updates.progressUpdate.targetCompletionDate)
            : null,
          actualCompletionDate: updates.progressUpdate.actualCompletionDate
            ? new Date(updates.progressUpdate.actualCompletionDate)
            : null,
          updatedAt: new Date(),
        });
      }

      await enquiry.save();
      await enquiry.populate("propertyId");

      res.json({
        success: true,
        message: "Enquiry updated successfully.",
        enquiry,
      });
    } catch (error) {
      console.error(
        "Update enquiry error:",
        error
      );

      res.status(500).json({
        message: "Failed to update enquiry.",
      });
    }
  }
);

// =====================================================
// DELETE ENQUIRY
// Admin only
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid enquiry ID.",
        });
      }

      const existingEnquiry = await Enquiry.findById(req.params.id);

      if (!existingEnquiry) {
        return res.status(404).json({
          message: "Enquiry not found.",
        });
      }
      if (existingEnquiry.bookingId) {
        return res.status(409).json({
          message: "An enquiry with a booking cannot be deleted.",
        });
      }
      await Enquiry.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "Enquiry deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete enquiry error:",
        error
      );

      res.status(500).json({
        message: "Failed to delete enquiry.",
      });
    }
  }
);

module.exports = router;