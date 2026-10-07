const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const Property = require("../models/Property");
const User = require("../models/User");


// =====================================================
// ADMIN DASHBOARD
// =====================================================

router.get(
  "/dashboard",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    try {

      // -----------------------------------------------
      // TOTAL PROPERTIES
      // -----------------------------------------------

      const totalProperties =
        await Property.countDocuments();


      // -----------------------------------------------
      // PENDING PROPERTIES
      // -----------------------------------------------

      const pendingProperties =
        await Property.countDocuments({
          status: "Pending",
        });


      // -----------------------------------------------
      // AVAILABLE PROPERTIES
      // -----------------------------------------------

      const availableProperties =
        await Property.countDocuments({
          status: {
            $in: [
              "Approved",
              "Available",
            ],
          },
        });


      // -----------------------------------------------
      // SOLD PROPERTIES
      // -----------------------------------------------

      const soldProperties =
        await Property.countDocuments({
          status: "Sold",
        });


      // -----------------------------------------------
      // TOTAL BUYERS
      // -----------------------------------------------

      const totalBuyers =
        await User.countDocuments({
          role: "buyer",
        });


      // -----------------------------------------------
      // SEND RESPONSE
      // -----------------------------------------------

      res.json({

        properties: totalProperties,

        pendingProperties:
          pendingProperties,

        availableProperties:
          availableProperties,

        soldProperties:
          soldProperties,

        buyers: totalBuyers,

        inquiries: 0,

        bookings: 0,

        favorites: 0,

        revenue: 0,

      });

    } catch (error) {

      console.error(
        "Admin dashboard error:",
        error
      );

      res.status(500).json({

        message:
          "Failed to load admin dashboard.",

      });

    }

  }
);


module.exports = router;