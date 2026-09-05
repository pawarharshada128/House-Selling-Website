const express = require("express");
const axios = require("axios");

const router = express.Router();

// =====================================================
// GET COORDINATES FROM GOOGLE MAPS URL
// =====================================================

router.post("/coordinates", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        message: "Google Maps URL is required.",
      });
    }

    console.log("Google Maps URL received:", url);

    // =================================================
    // CASE 1:
    // URL already contains @latitude,longitude
    //
    // Example:
    // https://www.google.com/maps/@18.5204,73.8567,15z
    // =================================================

    let match = url.match(
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/
    );

    if (match) {
      const latitude = Number(match[1]);
      const longitude = Number(match[2]);

      return res.json({
        success: true,
        latitude,
        longitude,
        originalUrl: url,
      });
    }

    // =================================================
    // CASE 2:
    // SHORT GOOGLE MAPS URL
    //
    // Example:
    // https://maps.app.goo.gl/YnianaRne9JJYjdN9
    // =================================================

    if (
      url.includes("maps.app.goo.gl") ||
      url.includes("goo.gl/maps")
    ) {
      try {
        const response = await axios.get(url, {
          maxRedirects: 10,
          timeout: 10000,
          validateStatus: (status) =>
            status >= 200 && status < 400,
        });

        const finalUrl = response.request?.res?.responseUrl;

        console.log("Final Google Maps URL:", finalUrl);

        if (finalUrl) {
          match = finalUrl.match(
            /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/
          );

          if (match) {
            const latitude = Number(match[1]);
            const longitude = Number(match[2]);

            return res.json({
              success: true,
              latitude,
              longitude,
              originalUrl: url,
              finalUrl,
            });
          }
        }
      } catch (error) {
        console.error(
          "Short Google Maps URL error:",
          error.message
        );
      }
    }

    // =================================================
    // COORDINATES NOT FOUND
    // =================================================

    return res.status(400).json({
      success: false,
      message:
        "Could not extract latitude and longitude from this Google Maps URL.",
    });

  } catch (error) {
    console.error(
      "Google Maps coordinate error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to process Google Maps URL.",
    });
  }
});

module.exports = router;