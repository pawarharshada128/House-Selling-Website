const express = require("express");
const mongoose = require("mongoose");

const Review = require("../models/Review");
const Enquiry = require("../models/Enquiry");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const buyerMiddleware = require("../middleware/buyerMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();
const VALID_STATUSES = ["Pending", "Approved", "Rejected"];

const resolveRequestType = (enquiry) => {
  const explicitType = enquiry.requestType || enquiry.type;
  if (explicitType === "BuildRequest" || explicitType === "PropertyBooking") {
    return explicitType;
  }

  const title = String(enquiry.propertyTitle || "").toLowerCase();
  const message = String(enquiry.message || "").toLowerCase();
  if (
    title.includes("build on your land") ||
    title.includes("build your dream home") ||
    message.startsWith("build on your land request") ||
    message.startsWith("build your dream home request")
  ) {
    return "BuildRequest";
  }

  return enquiry.propertyId ? "PropertyBooking" : "General";
};

const getEligibleEnquiries = async (customerId) => {
  const enquiries = await Enquiry.find({
    customerId,
    status: "Completed",
  })
    .populate("propertyId", "title")
    .sort({ updatedAt: -1 });

  const eligible = enquiries.filter((enquiry) =>
    ["PropertyBooking", "BuildRequest"].includes(resolveRequestType(enquiry))
  );
  const reviewedIds = await Review.distinct("enquiry", {
    customer: customerId,
    enquiry: { $in: eligible.map((enquiry) => enquiry._id) },
  });
  const reviewedSet = new Set(reviewedIds.map(String));

  return eligible.filter((enquiry) => !reviewedSet.has(String(enquiry._id)));
};

const buildReviewTitle = (enquiry) => {
  if (resolveRequestType(enquiry) === "BuildRequest") {
    const homeType = enquiry.buildDetails?.homeType;
    const location = enquiry.buildDetails?.landLocation;
    return [homeType, location].filter(Boolean).join(" - ") || "Construction project";
  }
  return enquiry.propertyId?.title || enquiry.propertyTitle || "Property purchase";
};

const getRatingSummary = async () => {
  const grouped = await Review.aggregate([
    { $match: { status: "Approved" } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  grouped.forEach(({ _id, count }) => {
    distribution[_id] = count;
  });
  const count = Object.values(distribution).reduce(
    (total, ratingCount) => total + ratingCount,
    0
  );
  const ratingTotal = Object.entries(distribution).reduce(
    (total, [rating, ratingCount]) => total + Number(rating) * ratingCount,
    0
  );

  return {
    average: count ? ratingTotal / count : 0,
    count,
    distribution,
  };
};

const parsePagination = (query) => {
  const requestedPage = Number.parseInt(query.page, 10);
  const requestedLimit = Number.parseInt(query.limit, 10);
  return {
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    limit:
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 50)
        : 6,
  };
};

router.get("/", async (req, res) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest: { rating: -1, createdAt: -1 },
      lowest: { rating: 1, createdAt: -1 },
    };
    const sort = sortOptions[req.query.sort] || sortOptions.newest;
    const filter = { status: "Approved" };
    const [reviews, total, summary] = await Promise.all([
      Review.find(filter)
        .select("customer property projectName rating title description verified createdAt")
        .populate("customer", "name")
        .populate("property", "title")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
      getRatingSummary(),
    ]);

    res.json({
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit),
      summary,
    });
  } catch (error) {
    console.error("Fetch public reviews error:", error);
    res.status(500).json({ message: "Failed to fetch reviews." });
  }
});

router.get("/summary", async (req, res) => {
  try {
    res.json(await getRatingSummary());
  } catch (error) {
    console.error("Fetch review summary error:", error);
    res.status(500).json({ message: "Failed to fetch review summary." });
  }
});

router.get("/eligible", authMiddleware, buyerMiddleware, async (req, res) => {
  try {
    const enquiries = await getEligibleEnquiries(req.user.id);
    res.json({
      eligible: enquiries.map((enquiry) => ({
        id: enquiry._id,
        type: resolveRequestType(enquiry),
        title: buildReviewTitle(enquiry),
        completedAt: enquiry.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Fetch review eligibility error:", error);
    res.status(500).json({ message: "Failed to verify review eligibility." });
  }
});

router.get("/mine", authMiddleware, buyerMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find({ customer: req.user.id })
      .populate("property", "title")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ reviews });
  } catch (error) {
    console.error("Fetch customer reviews error:", error);
    res.status(500).json({ message: "Failed to fetch your reviews." });
  }
});

router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const filter = {};
      if (VALID_STATUSES.includes(req.query.status)) {
        filter.status = req.query.status;
      }
      if (/^[1-5]$/.test(String(req.query.rating || ""))) {
        filter.rating = Number(req.query.rating);
      }
      const search = String(req.query.search || "").trim();
      if (search) {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const expression = new RegExp(escapedSearch, "i");
        const matchingCustomers = await User.find({ name: expression }).select("_id");
        filter.$or = [
          { title: expression },
          { description: expression },
          { projectName: expression },
          { customer: { $in: matchingCustomers.map((customer) => customer._id) } },
        ];
      }

      const [reviews, total] = await Promise.all([
        Review.find(filter)
          .populate("customer", "name email")
          .populate("property", "title")
          .populate("enquiry", "requestType type propertyTitle buildDetails createdAt")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Review.countDocuments(filter),
      ]);
      res.json({ reviews, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
      console.error("Fetch admin reviews error:", error);
      res.status(500).json({ message: "Failed to fetch reviews." });
    }
  }
);

router.post("/", authMiddleware, buyerMiddleware, async (req, res) => {
  try {
    const { enquiryId, rating, title, description } = req.body || {};
    if (
      !mongoose.Types.ObjectId.isValid(enquiryId) ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      typeof title !== "string" ||
      title.trim().length < 3 ||
      title.trim().length > 120 ||
      typeof description !== "string" ||
      description.trim().length < 20 ||
      description.trim().length > 2000
    ) {
      return res.status(400).json({
        message: "Provide an eligible completed project, a 1-5 star rating, a 3-120 character title, and a 20-2000 character review.",
      });
    }

    const enquiry = await Enquiry.findOne({
      _id: enquiryId,
      customerId: req.user.id,
      status: "Completed",
    }).populate("propertyId", "title");
    if (
      !enquiry ||
      !["PropertyBooking", "BuildRequest"].includes(resolveRequestType(enquiry))
    ) {
      return res.status(403).json({
        message: "A completed property booking or construction project linked to your account is required.",
      });
    }

    const review = await Review.create({
      customer: req.user.id,
      enquiry: enquiry._id,
      property: enquiry.propertyId?._id || null,
      projectName: buildReviewTitle(enquiry),
      rating,
      title: title.trim(),
      description: description.trim(),
      status: "Pending",
      verified: true,
    });
    res.status(201).json({
      message: "Review submitted. It will appear publicly after administrator approval.",
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already submitted a review for this completed purchase or project.",
      });
    }
    console.error("Submit review error:", error);
    res.status(500).json({ message: "Failed to submit your review." });
  }
});

router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { status } = req.body || {};
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid review ID." });
      }
      if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be Approved or Rejected." });
      }
      const review = await Review.findOneAndUpdate(
        { _id: req.params.id, status: "Pending" },
        { $set: { status } },
        { new: true, runValidators: true }
      )
        .populate("customer", "name email")
        .populate("property", "title");
      if (!review) {
        return res.status(404).json({
          message: "Pending review not found. Only pending reviews can be moderated.",
        });
      }
      res.json({ message: `Review ${status.toLowerCase()}.`, review });
    } catch (error) {
      console.error("Moderate review error:", error);
      res.status(500).json({ message: "Failed to update review status." });
    }
  }
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid review ID." });
      }
      const review = await Review.findByIdAndDelete(req.params.id);
      if (!review) {
        return res.status(404).json({ message: "Review not found." });
      }
      res.json({ message: "Review deleted." });
    } catch (error) {
      console.error("Delete review error:", error);
      res.status(500).json({ message: "Failed to delete review." });
    }
  }
);

module.exports = router;
