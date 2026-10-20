
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

require("dotenv").config();

const router = express.Router();

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ============================================
// TEMPORARY UPLOAD DIRECTORY
// Images stay local; videos are uploaded to
// Cloudinary and the temporary copy is deleted.
// ============================================

const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads")
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ============================================
// MULTER STORAGE
// ============================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname).toLowerCase();

    cb(null, uniqueName);
  },
});

// ============================================
// FILE TYPE VALIDATION
// ============================================

const allowedImages = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const allowedVideos = [
  "video/mp4",
  "video/webm",
  "video/ogg",
];

const fileFilter = (req, file, cb) => {
  if (
    allowedImages.includes(file.mimetype) ||
    allowedVideos.includes(file.mimetype)
  ) {
    return cb(null, true);
  }

  cb(
    new Error(
      "Only JPG, JPEG, PNG, WEBP images and MP4, WEBM, OGG videos are allowed."
    )
  );
};

// ============================================
// MULTER CONFIGURATION
// ============================================

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

// ============================================
// BACKEND URL FOR IMAGE UPLOADS
// ============================================

function getBackendUrl(req) {
  const configuredUrl = process.env.BACKEND_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
}

// ============================================
// UPLOAD IMAGE OR VIDEO
// POST /api/upload
// ============================================

router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    let temporaryFile = null;

    try {
      // -------------------------------
      // IMAGE UPLOAD (existing behavior)
      // -------------------------------

      if (req.files?.image?.[0]) {
        const file = req.files.image[0];
        const backendUrl = getBackendUrl(req);

        const imageUrl =
          `${backendUrl}/uploads/${file.filename}`;

        return res.status(200).json({
          message: "Image uploaded successfully.",
          image: imageUrl,
          url: imageUrl,
          type: file.mimetype,
        });
      }

      // -------------------------------
      // VIDEO UPLOAD TO CLOUDINARY
      // -------------------------------

      if (req.files?.video?.[0]) {
        const file = req.files.video[0];
        temporaryFile = file.path;

        if (
          !process.env.CLOUDINARY_CLOUD_NAME ||
          !process.env.CLOUDINARY_API_KEY ||
          !process.env.CLOUDINARY_API_SECRET
        ) {
          return res.status(500).json({
            message: "Cloudinary environment variables are missing.",
          });
        }

        const result = await cloudinary.uploader.upload(
          file.path,
          {
            resource_type: "video",
            folder: "sk-constructions/property-videos",
          }
        );

        // Remove temporary local video after successful upload.
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        temporaryFile = null;

        console.log("Video uploaded to Cloudinary:", result.public_id);

        return res.status(200).json({
          message: "Video uploaded successfully.",
          video: result.secure_url,
          url: result.secure_url,
          public_id: result.public_id,
          type: file.mimetype,
        });
      }

      return res.status(400).json({
        message: "No image or video uploaded.",
      });
    } catch (error) {
      console.error("Upload error:", error);

      return res.status(500).json({
        message: error.message || "File upload failed.",
      });
    } finally {
      // Clean up the temporary video if the upload failed.
      if (temporaryFile && fs.existsSync(temporaryFile)) {
        try {
          fs.unlinkSync(temporaryFile);
        } catch (cleanupError) {
          console.error("Temporary file cleanup failed:", cleanupError);
        }
      }
    }
  }
);

// ============================================
// UPLOAD ERROR HANDLER
// ============================================

router.use((err, req, res, next) => {
  console.error("Upload middleware error:", err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err instanceof multer.MulterError ? 400 : 400;

  return res.status(status).json({
    message: err.message || "File upload failed.",
  });
});

module.exports = router;
