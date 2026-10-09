
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// =====================================================
// UPLOAD DIRECTORY
// Must match server.js
// Default: backend/uploads
// =====================================================
const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads")
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

console.log("Upload route directory:", uploadDir);

// =====================================================
// FILE STORAGE
// =====================================================
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

// =====================================================
// ALLOWED FILE TYPES
// =====================================================
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

// =====================================================
// MULTER CONFIGURATION
// =====================================================
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

// =====================================================
// BACKEND URL
// =====================================================
function getBackendUrl(req) {
  const configuredUrl = process.env.BACKEND_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
}

// =====================================================
// UPLOAD IMAGE OR VIDEO
// POST /api/upload
// =====================================================
router.post(
  "/",
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "video",
      maxCount: 1,
    },
  ]),
  (req, res) => {
    try {
      const backendUrl = getBackendUrl(req);

      if (req.files?.image?.[0]) {
        const file = req.files.image[0];
        const imageUrl = `${backendUrl}/uploads/${file.filename}`;

        return res.status(200).json({
          message: "Image uploaded successfully.",
          image: imageUrl,
          url: imageUrl,
          type: file.mimetype,
        });
      }

      if (req.files?.video?.[0]) {
        const file = req.files.video[0];
        const videoUrl = `${backendUrl}/uploads/${file.filename}`;

        return res.status(200).json({
          message: "Video uploaded successfully.",
          video: videoUrl,
          url: videoUrl,
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
    }
  }
);

// =====================================================
// UPLOAD ERROR HANDLER
// =====================================================
router.use((err, req, res, next) => {
  console.error("Upload middleware error:", err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err instanceof multer.MulterError ? 400 : 500;

  return res.status(status).json({
    message: err.message || "File upload failed.",
  });
});

module.exports = router;