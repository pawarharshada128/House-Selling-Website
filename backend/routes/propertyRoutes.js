const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Property = require("../models/Property");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");


// =====================================================
// GET ALL PROPERTIES
// GET /api/properties
// PUBLIC
// =====================================================

router.get("/", async (req, res) => {
  try {
    const properties = await Property.find()
      .sort({ createdAt: -1 });

    console.log("Properties fetched from MongoDB:");
    console.log(properties);

    res.status(200).json(properties);

  } catch (error) {
    console.error("GET PROPERTIES ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch properties",
      error: error.message,
    });
  }
});


// =====================================================
// GET PROPERTY BY ID
// GET /api/properties/:id
// PUBLIC
// =====================================================

router.get("/:id", async (req, res) => {
  try {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid property ID",
      });
    }

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found",
      });
    }

    res.status(200).json(property);

  } catch (error) {

    console.error("GET PROPERTY ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch property",
      error: error.message,
    });
  }
});


// =====================================================
// ADD PROPERTY
// POST /api/properties
// ADMIN ONLY
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


      if (!title || !title.trim()) {
        return res.status(400).json({
          message: "Property title is required",
        });
      }

      if (!property_type) {
        return res.status(400).json({
          message: "Property type is required",
        });
      }

      if (!location || !location.trim()) {
        return res.status(400).json({
          message: "Location is required",
        });
      }

      if (price === undefined || price === "") {
        return res.status(400).json({
          message: "Price is required",
        });
      }

      if (bedrooms === undefined || bedrooms === "") {
        return res.status(400).json({
          message: "Bedrooms are required",
        });
      }

      if (bathrooms === undefined || bathrooms === "") {
        return res.status(400).json({
          message: "Bathrooms are required",
        });
      }


      const property = new Property({

        title: title.trim(),

        property_type,

        location: location.trim(),

        price: Number(price),

        bedrooms: Number(bedrooms),

        bathrooms: Number(bathrooms),

        area_sqft: Number(area_sqft || 0),

        description: description || "",

        image: image || "",

        status: "Pending",

        owner:
          req.user?.id ||
          req.user?._id,

      });


      const savedProperty =
        await property.save();


      console.log(
        "Property added:",
        savedProperty
      );


      res.status(201).json({
        message: "Property added successfully",
        property: savedProperty,
      });


    } catch (error) {

      console.error(
        "ADD PROPERTY ERROR:",
        error
      );

      res.status(500).json({
        message: "Failed to add property",
        error: error.message,
      });
    }
  }
);


// =====================================================
// UPDATE PROPERTY
// PUT /api/properties/:id
// ADMIN ONLY
// =====================================================

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    try {

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid property ID",
        });
      }


      const property =
        await Property.findById(id);


      if (!property) {
        return res.status(404).json({
          message: "Property not found",
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


      property.title =
        title ?? property.title;

      property.property_type =
        property_type ??
        property.property_type;

      property.location =
        location ?? property.location;

      property.price =
        price !== undefined
          ? Number(price)
          : property.price;

      property.bedrooms =
        bedrooms !== undefined
          ? Number(bedrooms)
          : property.bedrooms;

      property.bathrooms =
        bathrooms !== undefined
          ? Number(bathrooms)
          : property.bathrooms;

      property.area_sqft =
        area_sqft !== undefined
          ? Number(area_sqft)
          : property.area_sqft;

      property.description =
        description ??
        property.description;

      property.image =
        image ??
        property.image;


      const updatedProperty =
        await property.save();


      res.status(200).json({
        message:
          "Property updated successfully",
        property: updatedProperty,
      });


    } catch (error) {

      console.error(
        "UPDATE PROPERTY ERROR:",
        error
      );

      res.status(500).json({
        message: "Failed to update property",
        error: error.message,
      });
    }
  }
);


// =====================================================
// UPDATE STATUS
// PUT /api/properties/:id/status
// ADMIN ONLY
// =====================================================

router.put(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    try {

      const { id } = req.params;
      const { status } = req.body;


      const allowedStatuses = [
        "Pending",
        "Available",
        "Sold",
        "Rejected",
      ];


      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status",
        });
      }


      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid property ID",
        });
      }


      const property =
        await Property.findById(id);


      if (!property) {
        return res.status(404).json({
          message: "Property not found",
        });
      }


      property.status = status;

      const updatedProperty =
        await property.save();


      res.status(200).json({
        message:
          "Property status updated successfully",
        property: updatedProperty,
      });


    } catch (error) {

      console.error(
        "STATUS UPDATE ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update property status",
        error: error.message,
      });
    }
  }
);


// =====================================================
// DELETE PROPERTY
// DELETE /api/properties/:id
// ADMIN ONLY
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    try {

      const { id } = req.params;


      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid property ID",
        });
      }


      const property =
        await Property.findById(id);


      if (!property) {
        return res.status(404).json({
          message: "Property not found",
        });
      }


      await Property.findByIdAndDelete(id);


      res.status(200).json({
        message:
          "Property deleted successfully",
      });


    } catch (error) {

      console.error(
        "DELETE PROPERTY ERROR:",
        error
      );

      res.status(500).json({
        message: "Failed to delete property",
        error: error.message,
      });
    }
  }
);


module.exports = router;