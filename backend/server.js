const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// UPLOADS
// =====================================================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// =====================================================
// ROUTES
// =====================================================

const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const projectRoutes = require("./routes/projectRoutes");
const blogRoutes = require("./routes/blogRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/properties", propertyRoutes);

app.use("/api/wishlist", wishlistRoutes);

app.use("/api/inquiries", inquiryRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/blog", blogRoutes);

app.use("/api/testimonials", testimonialRoutes);
app.use(
  "/api/upload",
  uploadRoutes
);
// =====================================================
// IMAGE UPLOAD
// =====================================================

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
});

app.post(
  "/api/upload",
  upload.single("image"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No image uploaded.",
        });
      }

      const imageUrl =
        `http://localhost:${process.env.PORT || 5000}/uploads/` +
        req.file.filename;

      res.status(200).json({
        message: "Image uploaded successfully.",
        image: imageUrl,
      });
    } catch (error) {
      console.error("Upload error:", error);

      res.status(500).json({
        message: "Image upload failed.",
      });
    }
  }
);

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "HomeFinder API is running successfully.",
  });
});

// =====================================================
// 404
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found.",
  });
});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    message: "Internal server error.",
  });
});

// =====================================================
// MONGODB CONNECTION
// =====================================================

const PORT = process.env.PORT || 5000;

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error(
    "MONGO_URI or MONGODB_URI is missing in .env"
  );

  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully.");

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error
    );
  });