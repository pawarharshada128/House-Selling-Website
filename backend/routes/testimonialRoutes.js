const express = require("express");
const router = express.Router();

const Testimonial = require("../models/Testimonial");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// =====================================================
// GET ALL APPROVED TESTIMONIALS
// Public/authenticated users can view
// =====================================================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const testimonials = await Testimonial.find({
      approved: true,
    }).sort({ createdAt: -1 });

    res.status(200).json(testimonials);
  } catch (error) {
    console.error(
      "Get testimonials error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch testimonials.",
    });
  }
});

// =====================================================
// GET ALL TESTIMONIALS
// ADMIN ONLY
// =====================================================

router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const testimonials =
        await Testimonial.find().sort({
          createdAt: -1,
        });

      res.status(200).json(testimonials);
    } catch (error) {
      console.error(
        "Get admin testimonials error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch testimonials.",
      });
    }
  }
);

// =====================================================
// ADD TESTIMONIAL
// LOGGED-IN USER
// =====================================================

router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        role,
        message,
        rating,
        image,
      } = req.body;

      if (!name || !message) {
        return res.status(400).json({
          message:
            "Name and message are required.",
        });
      }

      const testimonial =
        new Testimonial({
          name: name.trim(),

          role:
            role?.trim() ||
            "Customer",

          message:
            message.trim(),

          rating:
            rating !== undefined
              ? Number(rating)
              : 5,

          image: image || "",

          // Admin must approve it
          approved: false,
        });

      const savedTestimonial =
        await testimonial.save();

      res.status(201).json({
        message:
          "Testimonial submitted successfully. Waiting for admin approval.",
        testimonial:
          savedTestimonial,
      });
    } catch (error) {
      console.error(
        "Add testimonial error:",
        error
      );

      res.status(400).json({
        message:
          error.message ||
          "Failed to add testimonial.",
      });
    }
  }
);

// =====================================================
// APPROVE / REJECT TESTIMONIAL
// ADMIN ONLY
// =====================================================

router.put(
  "/:id/approval",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { approved } = req.body;

      if (typeof approved !== "boolean") {
        return res.status(400).json({
          message:
            "Approved must be true or false.",
        });
      }

      const testimonial =
        await Testimonial.findById(
          req.params.id
        );

      if (!testimonial) {
        return res.status(404).json({
          message:
            "Testimonial not found.",
        });
      }

      testimonial.approved = approved;

      const updatedTestimonial =
        await testimonial.save();

      res.status(200).json({
        message: approved
          ? "Testimonial approved successfully."
          : "Testimonial rejected successfully.",

        testimonial:
          updatedTestimonial,
      });
    } catch (error) {
      console.error(
        "Testimonial approval error:",
        error
      );

      res.status(400).json({
        message:
          error.message ||
          "Failed to update testimonial.",
      });
    }
  }
);

// =====================================================
// DELETE TESTIMONIAL
// ADMIN ONLY
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const testimonial =
        await Testimonial.findById(
          req.params.id
        );

      if (!testimonial) {
        return res.status(404).json({
          message:
            "Testimonial not found.",
        });
      }

      await Testimonial.findByIdAndDelete(
        req.params.id
      );

      res.status(200).json({
        message:
          "Testimonial deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete testimonial error:",
        error
      );

      res.status(400).json({
        message:
          error.message ||
          "Failed to delete testimonial.",
      });
    }
  }
);

module.exports = router;