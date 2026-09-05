const express = require("express");
const router = express.Router();

const Cart = require("../models/Cart");
const Property = require("../models/Property");

// Change this path if your auth middleware is in another location
const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// ADD PROPERTY TO CART
// ==========================================
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { propertyId } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        message: "Property ID is required",
      });
    }

    // Find property
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({
        message: "Property not found",
      });
    }

    // Check whether property is already in cart
    const existingCart = await Cart.findOne({
      user: req.user.id,
      property: propertyId,
    });

    if (existingCart) {
      return res.status(400).json({
        message: "Property is already in cart",
      });
    }

    // Payment calculation
    const totalPayment = Number(property.price);

    const advancePayment = totalPayment * 0.10;

    const remainingPayment =
      totalPayment - advancePayment;

    // Create cart item
    const cart = new Cart({
      user: req.user.id,
      property: propertyId,
      totalPayment: totalPayment,
      advancePayment: advancePayment,
      remainingPayment: remainingPayment,
    });

    await cart.save();

    res.status(201).json({
      message: "Property added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// ==========================================
// GET USER CART
// ==========================================
router.get("/", authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.find({
      user: req.user.id,
    }).populate("property");

    res.status(200).json(cart);
  } catch (error) {
    console.error("Get cart error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ==========================================
// REMOVE PROPERTY FROM CART
// ==========================================
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const cartItem = await Cart.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!cartItem) {
      return res.status(404).json({
        message: "Cart item not found",
      });
    }

    res.status(200).json({
      message: "Property removed from cart",
    });
  } catch (error) {
    console.error("Remove cart error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;