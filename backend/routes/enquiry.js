const express = require("express");
const router = express.Router();

const Enquiry = require("../models/Enquiry");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// =====================================================
// CREATE ENQUIRY
// Public route
// =====================================================

router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      message,
      propertyId,
      propertyTitle,
    } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        message: "Please fill all required fields.",
      });
    }

    const enquiry = new Enquiry({
      name,
      email,
      phone,
      message,
      propertyId: propertyId || null,
      propertyTitle: propertyTitle || "",
    });

    await enquiry.save();

    res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully.",
      enquiry,
    });
  } catch (error) {
    console.error("Create enquiry error:", error);

    res.status(500).json({
      message: "Failed to submit enquiry.",
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
        .populate("propertyId")
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
      const { status } = req.body;

      const allowedStatuses = [
        "New",
        "Contacted",
        "Closed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid enquiry status.",
        });
      }

      const enquiry = await Enquiry.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!enquiry) {
        return res.status(404).json({
          message: "Enquiry not found.",
        });
      }

      res.json({
        success: true,
        message: "Enquiry status updated.",
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
      const enquiry = await Enquiry.findByIdAndDelete(
        req.params.id
      );

      if (!enquiry) {
        return res.status(404).json({
          message: "Enquiry not found.",
        });
      }

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