const express = require("express");
const BlogPost = require("../models/BlogPost");

const router = express.Router();

// GET all blog posts
router.get("/", async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch blog posts",
      error: error.message,
    });
  }
});

// GET blog post by slug
router.get("/:slug", async (req, res) => {
  try {
    const post = await BlogPost.findOne({
      slug: req.params.slug,
    });

    if (!post) {
      return res.status(404).json({
        message: "Blog post not found",
      });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch blog post",
      error: error.message,
    });
  }
});

// POST blog post
router.post("/", async (req, res) => {
  try {
    const post = await BlogPost.create(req.body);

    res.status(201).json({
      message: "Blog post created successfully",
      post,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create blog post",
      error: error.message,
    });
  }
});

module.exports = router;