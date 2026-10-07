const express = require("express");
const router = express.Router();

const Inquiry = require("../models/Enquiry");
const Property = require("../models/Property");

const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// CREATE INQUIRY
// =====================================================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      propertyId,
      name,
      email,
      phone,
      message,
    } = req.body;

    if (
      !propertyId ||
      !name ||
      !email ||
      !phone ||
      !message
    ) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    const property =
      await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        message: "Property not found.",
      });
    }

    const inquiry = new Inquiry({
      user: req.user.id,
      property: propertyId,
      name,
      email,
      phone,
      message,
    });

    await inquiry.save();

    res.status(201).json({
      message: "Inquiry submitted successfully.",
      inquiry,
    });
  } catch (error) {
    console.error("Inquiry error:", error);

    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
});

// =====================================================
// GET USER INQUIRIES
// =====================================================

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const inquiries = await Inquiry.find({
      user: req.user.id,
    })
      .populate("property")
      .sort({ createdAt: -1 });

    res.json(inquiries);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch inquiries.",
    });
  }
});

// =====================================================
// ADMIN - GET ALL INQUIRIES
// =====================================================

router.get(
  "/admin",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          message: "Admin access required.",
        });
      }

      const inquiries =
        await Inquiry.find()
          .populate("user", "name email")
          .populate("property", "title price location")
          .sort({ createdAt: -1 });

      res.json(inquiries);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch inquiries.",
      });
    }
  }
);

// =====================================================
// ADMIN - UPDATE INQUIRY STATUS
// =====================================================

router.put(
  "/:id/status",
  authMiddleware,
  async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          message: "Admin access required.",
        });
      }

      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Contacted",
        "Completed",
        "Rejected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid inquiry status.",
        });
      }

      const inquiry =
        await Inquiry.findByIdAndUpdate(
          req.params.id,
          { status },
          { new: true }
        )
          .populate("user", "name email")
          .populate(
            "property",
            "title price location"
          );

      if (!inquiry) {
        return res.status(404).json({
          message: "Inquiry not found.",
        });
      }

      res.json({
        message: "Inquiry status updated.",
        inquiry,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to update inquiry.",
      });
    }
  }
);

module.exports = router;