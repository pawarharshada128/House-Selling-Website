const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const dns = require("dns");

const mapRoutes = require("./routes/mapRoutes");

dotenv.config();

// =====================================================
// DNS
// =====================================================

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

// =====================================================
// TRUST PROXY
// =====================================================

app.set("trust proxy", 1);

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://shree-krishna-constructions.vercel.app",
    ],
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

const cartRoutes = require("./routes/cartRoutes");
const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const enquiryRoutes = require("./routes/enquiry");
const projectRoutes = require("./routes/projectRoutes");
const blogRoutes = require("./routes/blogRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminRoutes = require("./routes/admin");

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/admin", adminRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/upload", uploadRoutes);

// =====================================================
// HOME / HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
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
    message: err.message || "Internal server error.",
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
    "MONGO_URI or MONGODB_URI is missing in environment variables."
  );

  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully.");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error
    );

    process.exit(1);
  });