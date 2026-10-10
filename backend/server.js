const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// ================================
// MIDDLEWARE
// ================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://house-selling-website.onrender.com"
    ],
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================================
// STATIC FILES
// Existing disk-based uploads
// ================================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================================
// ROUTES
// ================================

const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const enquiryRoutes = require("./routes/enquiry");
const projectRoutes = require("./routes/projectRoutes");
const blogRoutes = require("./routes/blogRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const mapRoutes = require("./routes/mapRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

// New route for storing image binary data in MongoDB
const databaseImageRoutes = require("./routes/databaseImageRoutes");

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/database-images", databaseImageRoutes);

// ================================
// TEST ROUTE
// ================================

app.get("/", (req, res) => {
  res.status(200).json({
    message: "SK Constructions / HomeFinder API is running"
  });
});

// ================================
// NOT FOUND HANDLER
// ================================

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found"
  });
});

// ================================
// ERROR HANDLER
// ================================

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

// ================================
// DATABASE + SERVER
// ================================

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function startServer() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI or MONGODB_URI is missing from .env");
    }

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
