const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const authMiddleware = require("../middleware/authMiddleware");
// GET all properties
const adminMiddleware = require("../middleware/adminMiddleware");
router.get("/", async (req, res) => {
    try {
        const properties = await Property.find();
        res.json(properties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET property by ID
router.get("/:id", async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        res.json(property);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST new property
router.post("/", async (req, res) => {
    try {
        const property = new Property(req.body);
        const savedProperty = await property.save();

        res.status(201).json(savedProperty);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;