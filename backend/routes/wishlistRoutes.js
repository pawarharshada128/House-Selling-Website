const express = require("express");
const mongoose = require("mongoose");

const Wishlist = require("../models/Wishlist");
const Property = require("../models/Property");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// ADD PROPERTY TO WISHLIST
// POST /api/wishlist/:propertyId
// =====================================================

router.post("/:propertyId", authMiddleware, async (req, res) => {
  try {

    // Only buyer can use wishlist
    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can use wishlist",
      });
    }

    // Check property ID
    if (!mongoose.Types.ObjectId.isValid(req.params.propertyId)) {
      return res.status(400).json({
        message: "Invalid property ID",
      });
    }

    // Check property exists
    const property = await Property.findById(
      req.params.propertyId
    );

    if (!property) {
      return res.status(404).json({
        message: "Property not found",
      });
    }

    // Check if already exists
    const existingWishlist = await Wishlist.findOne({
      user: req.user.id,
      property: req.params.propertyId,
    });

    if (existingWishlist) {
      return res.status(400).json({
        message: "Property already in wishlist",
      });
    }

    // Create wishlist
    const wishlist = await Wishlist.create({
      user: req.user.id,
      property: req.params.propertyId,
    });

    res.status(201).json({
      message: "Property added to wishlist",
      wishlist,
    });

  } catch (error) {

    console.error("ADD WISHLIST ERROR:", error);

    res.status(500).json({
      message: "Failed to add property to wishlist",
      error: error.message,
    });
  }
});


// =====================================================
// GET MY WISHLIST
// GET /api/wishlist
// =====================================================

router.get("/", authMiddleware, async (req, res) => {
  try {

    if (req.user.role !== "buyer") {
      return res.status(403).json({
        message: "Only buyers can view wishlist",
      });
    }

    const wishlist = await Wishlist.find({
      user: req.user.id,
    })
      .populate("property")
      .sort({ createdAt: -1 });

    res.status(200).json(wishlist);

  } catch (error) {

    console.error("GET WISHLIST ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
});


// =====================================================
// REMOVE FROM WISHLIST
// DELETE /api/wishlist/:propertyId
// =====================================================

router.delete(
  "/:propertyId",
  authMiddleware,
  async (req, res) => {
    try {

      if (req.user.role !== "buyer") {
        return res.status(403).json({
          message: "Only buyers can manage wishlist",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.propertyId
        )
      ) {
        return res.status(400).json({
          message: "Invalid property ID",
        });
      }

      const deleted = await Wishlist.findOneAndDelete({
        user: req.user.id,
        property: req.params.propertyId,
      });

      if (!deleted) {
        return res.status(404).json({
          message: "Property not found in wishlist",
        });
      }

      res.status(200).json({
        message: "Property removed from wishlist",
      });

    } catch (error) {

      console.error(
        "DELETE WISHLIST ERROR:",
        error
      );

      res.status(500).json({
        message: "Failed to remove from wishlist",
        error: error.message,
      });
    }
  }
);


// =====================================================
// CHECK WHETHER PROPERTY IS IN WISHLIST
// GET /api/wishlist/check/:propertyId
// =====================================================

router.get(
  "/check/:propertyId",
  authMiddleware,
  async (req, res) => {
    try {

      const wishlist = await Wishlist.findOne({
        user: req.user.id,
        property: req.params.propertyId,
      });

      res.status(200).json({
        isWishlisted: !!wishlist,
      });

    } catch (error) {

      console.error(
        "CHECK WISHLIST ERROR:",
        error
      );

      res.status(500).json({
        message: "Failed to check wishlist",
      });
    }
  }
);


module.exports = router;