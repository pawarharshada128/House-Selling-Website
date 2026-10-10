
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const PropertyImage = require("../models/PropertyImage");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error("Only JPEG, PNG, and WEBP images are allowed."));
  },
});

// Upload an image to MongoDB
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image.",
      });
    }

    const savedImage = await PropertyImage.create({
      data: req.file.buffer,
      contentType: req.file.mimetype,
    });

    const imageUrl = `/api/database-images/${savedImage._id}`;

    return res.status(201).json({
      message: "Image saved in MongoDB successfully.",
      imageId: savedImage._id,
      image: imageUrl,
      url: imageUrl,
    });
  } catch (error) {
    console.error("Image upload error:", error);

    return res.status(500).json({
      message: "Failed to save image.",
    });
  }
});

// Display an image stored in MongoDB
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid image ID.",
      });
    }

    const image = await PropertyImage.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        message: "Image not found.",
      });
    }

    res.set("Content-Type", image.contentType);
    res.set("Cache-Control", "public, max-age=86400");

    return res.send(image.data);
  } catch (error) {
    console.error("Image retrieval error:", error);

    return res.status(500).json({
      message: "Failed to retrieve image.",
    });
  }
});

router.use((err, req, res, next) => {
  console.error("Database image route error:", err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(
    err instanceof multer.MulterError ? 400 : 400
  ).json({
    message: err.message || "Image upload failed.",
  });
});

module.exports = router;
