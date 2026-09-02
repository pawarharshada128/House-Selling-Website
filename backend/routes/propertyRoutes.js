const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Property = require("../models/Property");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// =====================================================
// HELPER - CHECK VALID OBJECT ID
// =====================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// =====================================================
// GET ALL PROPERTIES
// AUTHENTICATED USERS
// GET /api/properties
// =====================================================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const properties = await Property.find()
      .sort({ createdAt: -1 });

    res.status(200).json(properties);
  } catch (error) {
    console.error("Get properties error:", error);

    res.status(500).json({
      message: "Failed to fetch properties.",
    });
  }
});

// =====================================================
// GET PROPERTY BY ID
// AUTHENTICATED USERS
// GET /api/properties/:id
// =====================================================

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ObjectId before querying MongoDB
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid property ID.",
      });
    }

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found.",
      });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error("Get property error:", error);

    res.status(500).json({
      message: "Failed to fetch property.",
    });
  }
});

// =====================================================
// ADD NEW PROPERTY
// ADMIN ONLY
// POST /api/properties
// =====================================================

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const {
        title,
        property_type,
        location,
        price,
        bedrooms,
        bathrooms,
        area_sqft,
        description,
        image,
      } = req.body;

      // ---------------------------------------------
      // VALIDATION
      // ---------------------------------------------

      if (!title || !title.trim()) {
        return res.status(400).json({
          message: "Property title is required.",
        });
      }

      if (!property_type) {
        return res.status(400).json({
          message: "Property type is required.",
        });
      }

      if (!location || !location.trim()) {
        return res.status(400).json({
          message: "Property location is required.",
        });
      }

      if (
        price === undefined ||
        price === null ||
        price === ""
      ) {
        return res.status(400).json({
          message: "Property price is required.",
        });
      }

      if (
        bedrooms === undefined ||
        bedrooms === null ||
        bedrooms === ""
      ) {
        return res.status(400).json({
          message: "Number of bedrooms is required.",
        });
      }

      if (
        bathrooms === undefined ||
        bathrooms === null ||
        bathrooms === ""
      ) {
        return res.status(400).json({
          message: "Number of bathrooms is required.",
        });
      }

      // ---------------------------------------------
      // NUMBER VALIDATION
      // ---------------------------------------------

      const numericPrice = Number(price);
      const numericBedrooms = Number(bedrooms);
      const numericBathrooms = Number(bathrooms);
      const numericArea = Number(area_sqft || 0);

      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({
          message: "Please enter a valid price.",
        });
      }

      if (
        Number.isNaN(numericBedrooms) ||
        numericBedrooms < 0
      ) {
        return res.status(400).json({
          message: "Please enter valid bedrooms.",
        });
      }

      if (
        Number.isNaN(numericBathrooms) ||
        numericBathrooms < 0
      ) {
        return res.status(400).json({
          message: "Please enter valid bathrooms.",
        });
      }

      if (
        Number.isNaN(numericArea) ||
        numericArea < 0
      ) {
        return res.status(400).json({
          message: "Please enter a valid area.",
        });
      }

      // ---------------------------------------------
      // CREATE PROPERTY
      // ---------------------------------------------

      const propertyData = {
        title: title.trim(),

        property_type,

        location: location.trim(),

        price: numericPrice,

        bedrooms: numericBedrooms,

        bathrooms: numericBathrooms,

        area_sqft: numericArea,

        description:
          typeof description === "string"
            ? description.trim()
            : "",

        image: image || "",

        // New property starts as Pending
        status: "Pending",
      };

      // ---------------------------------------------
      // ADD OWNER IF USER ID EXISTS
      // ---------------------------------------------

      const userId = req.user.id || req.user._id;

      if (
        userId &&
        isValidObjectId(userId)
      ) {
        propertyData.owner = userId;
      }

      // ---------------------------------------------
      // SAVE
      // ---------------------------------------------

      const property = new Property(propertyData);

      const savedProperty =
        await property.save();

      res.status(201).json({
        message:
          "Property added successfully.",
        property: savedProperty,
      });
    } catch (error) {
      console.error(
        "Add property error:",
        error
      );

      res.status(400).json({
        message:
          error.message ||
          "Failed to add property.",
      });
    }
  }
);

// =====================================================
// UPDATE PROPERTY
// ADMIN ONLY
// PUT /api/properties/:id
// =====================================================

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // ---------------------------------------------
      // CHECK ID
      // ---------------------------------------------

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid property ID.",
        });
      }

      // ---------------------------------------------
      // FIND PROPERTY
      // ---------------------------------------------

      const property =
        await Property.findById(id);

      if (!property) {
        return res.status(404).json({
          message: "Property not found.",
        });
      }

      const {
        title,
        property_type,
        location,
        price,
        bedrooms,
        bathrooms,
        area_sqft,
        description,
        image,
      } = req.body;

      // ---------------------------------------------
      // UPDATE TITLE
      // ---------------------------------------------

      if (title !== undefined) {
        if (
          typeof title !== "string" ||
          !title.trim()
        ) {
          return res.status(400).json({
            message:
              "Property title cannot be empty.",
          });
        }

        property.title = title.trim();
      }

      // ---------------------------------------------
      // PROPERTY TYPE
      // ---------------------------------------------

      if (property_type !== undefined) {
        property.property_type =
          property_type;
      }

      // ---------------------------------------------
      // LOCATION
      // ---------------------------------------------

      if (location !== undefined) {
        if (
          typeof location !== "string" ||
          !location.trim()
        ) {
          return res.status(400).json({
            message:
              "Property location cannot be empty.",
          });
        }

        property.location =
          location.trim();
      }

      // ---------------------------------------------
      // PRICE
      // ---------------------------------------------

      if (price !== undefined) {
        const numericPrice = Number(price);

        if (
          Number.isNaN(numericPrice) ||
          numericPrice < 0
        ) {
          return res.status(400).json({
            message:
              "Please enter a valid price.",
          });
        }

        property.price = numericPrice;
      }

      // ---------------------------------------------
      // BEDROOMS
      // ---------------------------------------------

      if (bedrooms !== undefined) {
        const numericBedrooms =
          Number(bedrooms);

        if (
          Number.isNaN(numericBedrooms) ||
          numericBedrooms < 0
        ) {
          return res.status(400).json({
            message:
              "Please enter valid bedrooms.",
          });
        }

        property.bedrooms =
          numericBedrooms;
      }

      // ---------------------------------------------
      // BATHROOMS
      // ---------------------------------------------

      if (bathrooms !== undefined) {
        const numericBathrooms =
          Number(bathrooms);

        if (
          Number.isNaN(numericBathrooms) ||
          numericBathrooms < 0
        ) {
          return res.status(400).json({
            message:
              "Please enter valid bathrooms.",
          });
        }

        property.bathrooms =
          numericBathrooms;
      }

      // ---------------------------------------------
      // AREA
      // ---------------------------------------------

      if (area_sqft !== undefined) {
        const numericArea =
          Number(area_sqft);

        if (
          Number.isNaN(numericArea) ||
          numericArea < 0
        ) {
          return res.status(400).json({
            message:
              "Please enter a valid area.",
          });
        }

        property.area_sqft =
          numericArea;
      }

      // ---------------------------------------------
      // DESCRIPTION
      // ---------------------------------------------

      if (description !== undefined) {
        property.description =
          typeof description === "string"
            ? description.trim()
            : "";
      }

      // ---------------------------------------------
      // IMAGE
      // ---------------------------------------------

      if (image !== undefined) {
        property.image = image;
      }

      // ---------------------------------------------
      // SAVE
      // ---------------------------------------------

      const updatedProperty =
        await property.save();

      res.status(200).json({
        message:
          "Property updated successfully.",
        property: updatedProperty,
      });
    } catch (error) {
      console.error(
        "Update property error:",
        error
      );

      res.status(400).json({
        message:
          error.message ||
          "Failed to update property.",
      });
    }
  }
);

// =====================================================
// UPDATE PROPERTY STATUS
// ADMIN ONLY
// PUT /api/properties/:id/status
// =====================================================

router.put(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // ---------------------------------------------
      // CHECK ID
      // ---------------------------------------------

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid property ID.",
        });
      }

      // ---------------------------------------------
      // VALID STATUS
      // ---------------------------------------------

      const allowedStatuses = [
        "Pending",
        "Available",
        "Sold",
        "Rejected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid property status. Allowed values: Pending, Available, Sold, Rejected.",
        });
      }

      // ---------------------------------------------
      // FIND PROPERTY
      // ---------------------------------------------

      const property =
        await Property.findById(id);

      if (!property) {
        return res.status(404).json({
          message: "Property not found.",
        });
      }

      // ---------------------------------------------
      // UPDATE STATUS
      // ---------------------------------------------

      property.status = status;

      const updatedProperty =
        await property.save();

      res.status(200).json({
        message:
          "Property status updated successfully.",
        property: updatedProperty,
      });
    } catch (error) {
      console.error(
        "Update status error:",
        error
      );

      res.status(400).json({
        message:
          error.message ||
          "Failed to update property status.",
      });
    }
  }
);

// =====================================================
// DELETE PROPERTY
// ADMIN ONLY
// DELETE /api/properties/:id
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // ---------------------------------------------
      // CHECK ID
      // ---------------------------------------------

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          message: "Invalid property ID.",
        });
      }

      // ---------------------------------------------
      // FIND PROPERTY
      // ---------------------------------------------

      const property =
        await Property.findById(id);

      if (!property) {
        return res.status(404).json({
          message: "Property not found.",
        });
      }

      // ---------------------------------------------
      // DELETE
      // ---------------------------------------------

      await Property.findByIdAndDelete(id);

      res.status(200).json({
        message:
          "Property deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete property error:",
        error
      );

      res.status(400).json({
        message:
          error.message ||
          "Failed to delete property.",
      });
    }
  }
);

module.exports = router;