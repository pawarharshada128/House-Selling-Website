
const dns = require("dns");

// Fix Node.js DNS resolution for MongoDB Atlas
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// =====================================
// CONFIGURATION
// =====================================

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const allowedOrigins = [
  "http://localhost:5173",
  "https://shree-krishna-constructions.vercel.app"
];

// =====================================
// MIDDLEWARE
// =====================================

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header, such as local tools.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// =====================================
// STATIC FILES
// =====================================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// =====================================
// API ROUTES
// =====================================

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

// =====================================
// HEALTH CHECK
// =====================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SK Constructions / HomeFinder API is running"
  });
});

// =====================================
// 404 HANDLER
// =====================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});

// =====================================
// ERROR HANDLER
// =====================================

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed by CORS"
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

// =====================================
// MONGODB + SERVER STARTUP
// =====================================

async function startServer() {
  try {
    if (!MONGO_URI) {
      throw new Error(
        "MongoDB connection string is missing. Set MONGO_URI in environment variables."
      );
    }

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
