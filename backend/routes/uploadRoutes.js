
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads")
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

console.log("Upload route directory:", uploadDir);

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

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "video/mp4",
    "video/webm",
    "video/ogg",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error("Only MP4, WebM, and OGG videos are allowed."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

function getBackendUrl(req) {
  const configuredUrl = process.env.BACKEND_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
}

router.post("/", upload.single("video"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No video uploaded.",
      });
    }

    const videoUrl =
      `${getBackendUrl(req)}/uploads/${req.file.filename}`;

    return res.status(200).json({
      message: "Video uploaded successfully.",
      video: videoUrl,
      url: videoUrl,
      type: req.file.mimetype,
    });
  } catch (error) {
    console.error("Video upload error:", error);

    return res.status(500).json({
      message: "Video upload failed.",
    });
  }
});

router.use((err, req, res, next) => {
  console.error("Video upload middleware error:", err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(
    err instanceof multer.MulterError ? 400 : 500
  ).json({
    message: err.message || "Video upload failed.",
  });
});

module.exports = router;
