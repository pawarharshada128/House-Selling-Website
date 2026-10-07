import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from "react-leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import "./App.css";

// ==============================
// API URL
// ==============================

const API_URL = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

// ==============================
// LEAFLET MARKER ICON FIX
// ==============================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ==============================
// PROPERTY DETAILS
// ==============================

function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");

  // ==============================
  // BOOKING POPUP STATES
  // ==============================

  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState("");

  // ==============================
  // FETCH PROPERTY DETAILS
  // ==============================

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);

        console.log(
          "Fetching property with ID:",
          `${API_URL}/properties/${id}`
        );

        const response = await fetch(
          `${API_URL}/properties/${id}`
        );

        const data = await response.json();

        console.log("PROPERTY DATA:", data);

        if (!response.ok) {
          console.error("Error:", data);
          setProperty(null);
          return;
        }

        console.log("Fetched property:", data);

        setProperty(data);

        // Set main image
        if (data.image) {
          setSelectedImage(data.image);
        } else if (
          Array.isArray(data.images) &&
          data.images.length > 0
        ) {
          setSelectedImage(data.images[0]);
        }
      } catch (error) {
        console.error(
          "Error fetching property:",
          error
        );

        setProperty(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  // ==============================
  // IMAGE URL
  // ==============================

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    return `${SERVER_URL}${
      image.startsWith("/") ? "" : "/"
    }${image}`;
  };

  // ==============================
  // BOOK HOME
  // ==============================

  const handleBookHome = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        state: {
          fromBooking: true,
          property: property,
        },
      });

      return;
    }

    setEnquiryMessage("");
    setShowBookingPopup(true);
  };

  // ==============================
  // BOOKING ENQUIRY SUBMIT
  // ==============================

  const handleBookingEnquiry = async (e) => {
    e.preventDefault();

    setEnquiryLoading(true);
    setEnquiryMessage("");

    const form = e.target;

    const enquiryData = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      message: form.message.value,
      propertyId: property._id,
      propertyTitle: property.title,
    };

    try {
      const response = await fetch(
        `${API_URL}/enquiries`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(enquiryData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to send enquiry."
        );
      }

      setEnquiryMessage(
        "Your enquiry has been submitted successfully."
      );

      form.reset();

    } catch (error) {
      console.error(
        "Enquiry error:",
        error
      );

      setEnquiryMessage(
        error.message ||
          "Failed to submit enquiry."
      );
    } finally {
      setEnquiryLoading(false);
    }
  };

  // ==============================
  // ADD TO CART
  // ==============================

  const handleAddToCart = () => {
    const token = localStorage.getItem("token");

    // User is NOT logged in
    if (!token) {
      navigate("/login", {
        state: {
          fromCart: true,
          property: property,
        },
      });

      return;
    }

    // User is already logged in
    navigate("/contact", {
      state: {
        property: property,
        fromCart: true,
      },
    });
  };

  // ==============================
  // SHORTLIST
  // ==============================

  const handleShortlist = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      return;
    }

    if (!property) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/wishlist/${property._id}`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Could not add to shortlist."
        );

        return;
      }

      alert(
        "Property added to shortlist!"
      );

    } catch (error) {
      console.error(
        "Shortlist error:",
        error
      );

      alert("Backend connection failed.");
    }
  };

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading property...</h2>
      </div>
    );
  }

  // ==============================
  // PROPERTY NOT FOUND
  // ==============================

  if (!property) {
    return (
      <div className="no-properties">

        <h2>
          Property Not Found
        </h2>

        <button
          className="view-button"
          onClick={() => navigate("/")}
        >
          ← Back to Properties
        </button>

      </div>
    );
  }

  // ==============================
  // IMAGE GALLERY
  // ==============================

  const allImages = [];

  if (property.image) {
    allImages.push(property.image);
  }

  if (Array.isArray(property.images)) {
    property.images.forEach((img) => {
      if (
        img &&
        !allImages.includes(img)
      ) {
        allImages.push(img);
      }
    });
  }

  const mainImage =
    getImageUrl(selectedImage);

  // ==============================
  // VIDEO URL
  // ==============================

  const videoUrl = property.video
    ? property.video.startsWith("http://") ||
      property.video.startsWith("https://")
      ? property.video
      : `${SERVER_URL}${
          property.video.startsWith("/")
            ? ""
            : "/"
        }${property.video}`
    : "";

  // ==============================
  // STATUS
  // ==============================

  const statusClass = property.status
    ? property.status.toLowerCase()
    : "pending";

  // ==============================
  // PAYMENT CALCULATIONS
  // ==============================

  const totalPayment =
    Number(property.price || 0);

  const advancePayment =
    totalPayment * 0.10;

  const remainingPayment =
    totalPayment - advancePayment;

  // ==============================
  // MAP COORDINATES
  // ==============================

  const latitude =
    Number(property.latitude);

  const longitude =
    Number(property.longitude);

  const hasCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  // ==============================
  // RETURN
  // ==============================

  return (
    <div className="property-details-page">

      {/* ==============================
          BACK BUTTON
      ============================== */}

      <button
        className="back-button"
        onClick={() => navigate("/")}
      >
        ← Back to Properties
      </button>

      {/* ==============================
          PROPERTY HEADER
      ============================== */}

      <div className="details-header">

        <div>

          <span className="details-type-badge">
            {property.property_type ||
              "Property"}
          </span>

          <h1>
            {property.title}
          </h1>

          <p className="location">
            📍 {property.location}
          </p>

        </div>

        <div className="details-price">
          ₹
          {totalPayment.toLocaleString(
            "en-IN"
          )}
        </div>

      </div>

      {/* ==============================
          MAIN PROPERTY SECTION
      ============================== */}

      <div className="details-container">

        {/* ==============================
            IMAGE SECTION
        ============================== */}

        <div className="details-image-section">

          {mainImage ? (
            <img
              src={mainImage}
              alt={property.title}
              className="details-main-image"
            />
          ) : (
            <div className="details-no-image">
              🏠
            </div>
          )}

          {/* IMAGE GALLERY */}

          {allImages.length > 0 && (
            <div
              className="property-image-gallery"
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "15px",
                flexWrap: "wrap",
              }}
            >

              {allImages.map(
                (image, index) => {

                  const imageUrl =
                    getImageUrl(image);

                  return (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`Property ${
                        index + 1
                      }`}
                      onClick={() =>
                        setSelectedImage(
                          image
                        )
                      }
                      style={{
                        width: "90px",
                        height: "70px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        cursor: "pointer",

                        border:
                          selectedImage ===
                          image
                            ? "3px solid #2563eb"
                            : "2px solid #ddd",
                      }}
                    />
                  );
                }
              )}

            </div>
          )}

        </div>

        {/* ==============================
            PROPERTY INFORMATION
        ============================== */}

        <div className="details-info">

          {/* PROPERTY INFO */}

          <div className="property-info-grid">

            <div className="info-box">

              <strong>
                {property.bedrooms ?? 0}
              </strong>

              <span>
                Bedrooms
              </span>

            </div>

            <div className="info-box">

              <strong>
                {property.bathrooms ?? 0}
              </strong>

              <span>
                Bathrooms
              </span>

            </div>

            <div className="info-box">

              <strong>
                {property.area_sqft ?? 0}
              </strong>

              <span>
                Sq. Ft.
              </span>

            </div>

          </div>

          {/* STATUS */}

          <div className="status-box">

            <strong>
              Status:
            </strong>{" "}

            <span
              className={`property-status ${statusClass}`}
            >
              {property.status ||
                "Pending"}
            </span>

          </div>

          {/* DESCRIPTION */}

          <div className="description">

            <h2>
              Description
            </h2>

            <p>
              {property.description
                ? property.description
                : "No description available."}
            </p>

          </div>

          {/* ==============================
              ACTION BUTTONS
          ============================== */}

          <div className="property-details-actions">

            <button
              className="shortlist-btn"
              onClick={handleBookHome}
            >
              Book Home
            </button>

            <button
              className="shortlist-btn"
              onClick={handleShortlist}
            >
              ❤️ Shortlist
            </button>

          </div>

        </div>

      </div>

      {/* ==============================
          PROPERTY VIDEO
      ============================== */}

      {videoUrl && (
        <div
          className="details-container"
          style={{
            marginTop: "30px",
            display: "block",
          }}
        >

          <h2>
            Property Video
          </h2>

          <video
            controls
            style={{
              width: "100%",
              maxWidth: "900px",
              borderRadius: "12px",
              marginTop: "15px",
            }}
          >

            <source
              src={videoUrl}
              type="video/mp4"
            />

            Your browser does not support
            video playback.

          </video>

        </div>
      )}

      {/* ==============================
          PROPERTY MAP
      ============================== */}

      {hasCoordinates && (
        <div
          className="map-section"
          style={{
            marginTop: "30px",
            width: "100%",
          }}
        >

          <h2>
            📍 Property Location
          </h2>

          <MapContainer
            center={[
              latitude,
              longitude
            ]}
            zoom={15}
            scrollWheelZoom={true}
            style={{
              height: "400px",
              width: "100%",
              borderRadius: "12px",
              marginTop: "15px",
            }}
          >

            <TileLayer
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker
              position={[
                latitude,
                longitude
              ]}
            >

              <Popup>

                <b>
                  {property.title}
                </b>

                <br />

                {property.location}

              </Popup>

            </Marker>

          </MapContainer>

          {/* GOOGLE MAP LINK */}

          {property.map_location && (
            <a
              href={
                property.map_location
              }
              target="_blank"
              rel="noopener noreferrer"
              className="google-map-link"
              style={{
                display: "inline-block",
                marginTop: "15px",
              }}
            >
              🗺️ Open in Google Maps
            </a>
          )}

        </div>
      )}

      {/* ==============================
          MAP NOT AVAILABLE MESSAGE
      ============================== */}

      {!hasCoordinates && (
        <div
          className="map-section"
          style={{
            marginTop: "30px",
            padding: "20px",
            borderRadius: "12px",
            background: "#f5f5f5",
          }}
        >

          <h2>
            📍 Property Location
          </h2>

          <p>
            Location coordinates are not
            available for this property.
          </p>

          {property.map_location && (
            <a
              href={
                property.map_location
              }
              target="_blank"
              rel="noopener noreferrer"
              className="google-map-link"
            >
              🗺️ Open in Google Maps
            </a>
          )}

        </div>
      )}

      {/* ==============================
          COORDINATES
      ============================== */}

      {hasCoordinates && (
        <div
          className="details-container"
          style={{
            marginTop: "30px",
            display: "block",
          }}
        >

          <h2>
            Property Coordinates
          </h2>

          <p>
            <strong>
              Latitude:
            </strong>{" "}
            {latitude}
          </p>

          <p>
            <strong>
              Longitude:
            </strong>{" "}
            {longitude}
          </p>

        </div>
      )}

      {/* ==============================
          BOOK HOME POPUP
      ============================== */}

      {showBookingPopup && (
        <div className="booking-popup-overlay">

          <div className="booking-popup">

            {/* POPUP HEADER */}

            <div className="booking-popup-header">

              <div>

                <span className="section-label">
                  HOME BOOKING
                </span>

                <h2>
                  Book This Property
                </h2>

              </div>

              <button
                className="booking-close-btn"
                onClick={() =>
                  setShowBookingPopup(false)
                }
              >
                ×
              </button>

            </div>

            {/* ==============================
                PROPERTY INFORMATION
            ============================== */}

            <div className="booking-property-info">

              <h3>
                {property.title}
              </h3>

              <p>
                <strong>
                  Property Type:
                </strong>{" "}
                {property.property_type ||
                  "Property"}
              </p>

              <p>
                <strong>
                  Location:
                </strong>{" "}
                {property.location}
              </p>

              <div className="booking-property-grid">

                <div>

                  <span>
                    Bedrooms
                  </span>

                  <strong>
                    {property.bedrooms ?? 0}
                  </strong>

                </div>

                <div>

                  <span>
                    Bathrooms
                  </span>

                  <strong>
                    {property.bathrooms ?? 0}
                  </strong>

                </div>

                <div>

                  <span>
                    Area
                  </span>

                  <strong>
                    {property.area_sqft ?? 0} Sq. Ft.
                  </strong>

                </div>

              </div>

            </div>

            {/* ==============================
                PAYMENT INFORMATION
            ============================== */}

            <div className="booking-payment">

              <h3>
                Payment Details
              </h3>

              <div className="booking-payment-row">

                <span>
                  Total Payment
                </span>

                <strong>
                  ₹
                  {totalPayment.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

              <div className="booking-payment-row">

                <span>
                  Advance Payment (10%)
                </span>

                <strong>
                  ₹
                  {advancePayment.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

              <div className="booking-payment-row remaining">

                <span>
                  Remaining Payment
                </span>

                <strong>
                  ₹
                  {remainingPayment.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

            </div>

            {/* ==============================
                CONTACT INFORMATION
            ============================== */}

            <div className="booking-contact">

              <h3>
                Contact Information
              </h3>

              <p>
                Please provide your details.
                Our team will contact you
                regarding this property.
              </p>

              {enquiryMessage && (
                <div className="booking-message">
                  {enquiryMessage}
                </div>
              )}

              <form
                onSubmit={
                  handleBookingEnquiry
                }
              >

                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  required
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  required
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Your Phone"
                  required
                />

                <textarea
                  name="message"
                  rows="4"
                  required
                  defaultValue={`I am interested in ${property.title}. I would like to know more about the booking process, payment options and availability.`}
                />

                <div className="booking-popup-actions">

                  <button
                    type="button"
                    className="booking-cancel-btn"
                    onClick={() =>
                      setShowBookingPopup(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="booking-submit-btn"
                    disabled={enquiryLoading}
                  >
                    {enquiryLoading
                      ? "Submitting..."
                      : "Submit Enquiry"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default PropertyDetails;