import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

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
import { useLocale } from "./LocaleContext";

import "./App.css";

// ==============================
// API URL
// ==============================

// const API_URL = "http://localhost:5000/api";
// const SERVER_URL = "http://localhost:5000";
const API_URL = "https://house-selling-website.onrender.com/api";
const SERVER_URL = "https://house-selling-website.onrender.com";
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
  const location = useLocation();
  const { t } = useLocale();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState("");
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null")?.role === "admin";
    } catch (error) {
      console.error("Unable to read saved user:", error);
      return false;
    }
  });

  // ==============================
  // BOOKING POPUP STATES
  // ==============================

  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const enquiryPending = useRef(false);

  // ==============================
  // FETCH PROPERTY DETAILS
  // ==============================

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setLoadError("");

        console.log(
          "Fetching property with ID:",
          `${API_URL}/properties/${id}`
        );

        const response = await fetch(
          `${API_URL}/properties/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          setProperty(null);
          setLoadError(
            data.message || "This property could not be found."
          );
          return;
        }

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
        setLoadError(
          "We couldn't load this property. Check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, reloadCount]);

  useEffect(() => {
    if (location.state?.openBooking && property) {
      setShowBookingPopup(true);
      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    }
  }, [location.pathname, location.state, navigate, property]);

  useEffect(() => {
    if (!showImageViewer) {
      return undefined;
    }

    const images = [
      property?.image,
      ...(Array.isArray(property?.images)
        ? property.images
        : []),
    ].filter((image, index, allImages) =>
      image && allImages.indexOf(image) === index
    );

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowImageViewer(false);
      }

      if (
        (event.key === "ArrowRight" ||
          event.key === "ArrowLeft") &&
        images.length > 1
      ) {
        event.preventDefault();

        setSelectedImage((currentImage) => {
          const currentIndex = images.indexOf(currentImage);
          const direction = event.key === "ArrowRight" ? 1 : -1;
          const nextIndex =
            (currentIndex + direction + images.length) % images.length;

          return images[nextIndex];
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [property, showImageViewer]);

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
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      console.error("Unable to read saved user:", error);
    }

    if (!token || user?.role !== "buyer") {
      if (user?.role === "admin") {
        setEnquiryMessage("Sign in with a customer account to submit an enquiry.");
        return;
      }
      navigate("/login", {
        state: {
          returnTo: `/property/${property._id}`,
          returnState: { openBooking: true },
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
    if (enquiryPending.current) return;

    enquiryPending.current = true;
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
      requestType: "PropertyBooking",
    };
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_URL}/enquiries`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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

      setEnquiryMessage(`Your enquiry has been submitted successfully. Reference ID: ${data.referenceId || data.enquiry?._id}`);

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
      enquiryPending.current = false;
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
      navigate("/login", {
        state: {
          fromWishlist: true,
          property,
        },
      });
      return;
    }

    if (!property) {
      return;
    }

    setShortlistLoading(true);
    setActionMessage("");

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
        throw new Error(
          data.message ||
            "Could not add to shortlist."
        );
      }

      setActionMessage(
        data.message || "Property added to your shortlist."
      );

    } catch (error) {
      console.error(
        "Shortlist error:",
        error
      );

      setActionMessage(
        error.message || "Could not connect to the server."
      );
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: property.title,
      text: `Take a look at ${property.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setActionMessage("Property shared.");
        return;
      }

      if (!navigator.clipboard) {
        throw new Error(
          "Copying the link is not supported in this browser."
        );
      }

      await navigator.clipboard.writeText(shareData.url);
      setActionMessage("Property link copied.");
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }

      console.error("Share property error:", error);
      setActionMessage(
        error.message || "Unable to share this property."
      );
    }
  };

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <div
        className="property-details-loading"
        role="status"
        aria-live="polite"
      >
        <span className="property-loading-spinner" aria-hidden="true" />
        <h2>{t("Finding your property")}</h2>
        <p>{t("Just a moment while we load the details and photos.")}</p>
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
          {loadError ? t("Unable to show this property") : t("Property Not Found")}
        </h2>

        <p>
          {loadError ? t(loadError) : t("This listing may have been removed or is no longer available.")}
        </p>

        {loadError && (
          <button
            className="view-button"
            onClick={() => setReloadCount((count) => count + 1)}
          >
            {t("Try Again")}
          </button>
        )}

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

  const handlePropertyStatusChange = async (event) => {
    const status = event.target.value;
    const token = localStorage.getItem("token");
    if (!token || !isAdmin) {
      setStatusMessage(t("Admin sign-in is required to update property status."));
      return;
    }

    setStatusSaving(true);
    setStatusMessage("");
    try {
      const response = await fetch(`${API_URL}/properties/${property._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || t("Failed to update property status."));
      }

      setProperty(data.property || { ...property, status });
      setStatusMessage(data.message || t("Property status updated successfully."));
    } catch (error) {
      console.error("Property status update error:", error);
      setStatusMessage(error.message || t("Failed to update property status."));
    } finally {
      setStatusSaving(false);
    }
  };

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
        aria-label={t("Back to property listings")}
      >
        <span aria-hidden="true">←</span> {t("All properties")}
      </button>

      {/* ==============================
          PROPERTY HEADER
      ============================== */}

      <div className="details-header">

        <div>

          <span className="details-type-badge">
            {t(property.property_type || "Property")}
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
            <button
              type="button"
              className="details-main-image-button"
              onClick={() => setShowImageViewer(true)}
              aria-label={t("Open property photo viewer")}
            >
              <img
                src={mainImage}
                alt={property.title}
                className="details-main-image"
              />
              <span className="image-viewer-hint">
                {t("View photos")}
                {allImages.length > 1 &&
                  ` · ${allImages.length} photos`}
              </span>
            </button>
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
                    <button
                      key={index}
                      type="button"
                      className={`property-gallery-thumbnail ${
                        selectedImage === image ? "active" : ""
                      }`}
                      aria-label={`${t("Show property photo")} ${index + 1}`}
                      aria-pressed={selectedImage === image}
                      onClick={() =>
                        setSelectedImage(
                          image
                        )
                      }
                    >
                      <img
                        src={imageUrl}
                        alt=""
                        className="property-gallery-thumbnail-image"
                      />
                    </button>
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
                {t("Bedrooms")}
              </span>

            </div>

            <div className="info-box">

              <strong>
                {property.bathrooms ?? 0}
              </strong>

              <span>
                {t("Bathrooms")}
              </span>

            </div>

            <div className="info-box">

              <strong>
                {property.area_sqft ?? 0}
              </strong>

              <span>
                {t("Sq. Ft.")}
              </span>

            </div>

          </div>

          {/* STATUS */}

          <div className="status-box">

            <strong>
              {t("Status")}:
            </strong>{" "}

            <span
              className={`property-status ${statusClass}`}
            >
              {t(property.status || "Pending")}
            </span>

          </div>
          {isAdmin && (
            <div className="property-status-admin">
              <label htmlFor="property-status-update">{t("Update property status")}</label>
              <select
                id="property-status-update"
                value={property.status || "Pending"}
                onChange={handlePropertyStatusChange}
                disabled={statusSaving}
              >
                {["Pending", "Available", "Sold", "Rejected"].map((status) => (
                  <option value={status} key={status}>{t(status)}</option>
                ))}
              </select>
              {statusSaving && <span role="status">{t("Saving...")}</span>}
              {statusMessage && <p role="status" aria-live="polite">{statusMessage}</p>}
            </div>
          )}

          {/* DESCRIPTION */}

          <div className="description">

            <h2>
              {t("Description")}
            </h2>

            <p>
              {property.description
                ? descriptionExpanded ||
                  property.description.length <= 280
                  ? property.description
                  : `${property.description.slice(0, 280).trimEnd()}...`
                : t("No description available.")}
            </p>

            {property.description?.length > 280 && (
              <button
                type="button"
                className="description-toggle"
                aria-expanded={descriptionExpanded}
                onClick={() =>
                  setDescriptionExpanded((expanded) => !expanded)
                }
              >
                {descriptionExpanded ? t("Show less") : t("Read full description")}
              </button>
            )}

          </div>

          {/* ==============================
              ACTION BUTTONS
          ============================== */}

          <div className="property-details-actions">

            <button
              className="shortlist-btn"
              onClick={handleBookHome}
              disabled={property.status === "Sold"}
            >
              {property.status === "Sold"
                ? t("Property Sold")
                : t("Send Enquiry")}
            </button>

            <button
              className="shortlist-btn"
              onClick={handleShortlist}
              disabled={shortlistLoading}
            >
              {shortlistLoading
                ? t("Adding...")
                : `♡ ${t("Shortlist")}`}
            </button>

            <button
              className="share-property-btn"
              onClick={handleShare}
            >
              {t("Share")}
            </button>

          </div>

          {actionMessage && (
            <p className="property-action-message" role="status">
              {actionMessage}
            </p>
          )}

        </div>

      </div>

      <div className="details-mobile-actions">
        <button
          type="button"
          className="mobile-shortlist-button"
          onClick={handleShortlist}
          disabled={shortlistLoading}
        >
          {shortlistLoading ? t("Adding...") : `♡ ${t("Save")}`}
        </button>
        <button
          type="button"
          className="mobile-book-button"
          onClick={handleBookHome}
          disabled={property.status === "Sold"}
        >
          {property.status === "Sold" ? t("Sold") : t("Enquire about this home")}
        </button>
      </div>

      {showImageViewer && mainImage && (
        <div
          className="property-image-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={t("Property photo viewer")}
          onClick={() => setShowImageViewer(false)}
        >
          <button
            type="button"
            className="image-viewer-close"
            aria-label={t("Close photo viewer")}
            onClick={() => setShowImageViewer(false)}
          >
            ×
          </button>

          {allImages.length > 1 && (
            <button
              type="button"
              className="image-viewer-arrow previous"
              aria-label={t("Previous photo")}
              onClick={(event) => {
                event.stopPropagation();
                const currentIndex = allImages.indexOf(selectedImage);
                const previousIndex =
                  (currentIndex - 1 + allImages.length) % allImages.length;
                setSelectedImage(allImages[previousIndex]);
              }}
            >
              ‹
            </button>
          )}

          <img
            src={mainImage}
            alt={`${property.title} photo`}
            className="image-viewer-photo"
            onClick={(event) => event.stopPropagation()}
          />

          {allImages.length > 1 && (
            <button
              type="button"
              className="image-viewer-arrow next"
              aria-label={t("Next photo")}
              onClick={(event) => {
                event.stopPropagation();
                const currentIndex = allImages.indexOf(selectedImage);
                const nextIndex = (currentIndex + 1) % allImages.length;
                setSelectedImage(allImages[nextIndex]);
              }}
            >
              ›
            </button>
          )}

          <span className="image-viewer-count">
            {allImages.indexOf(selectedImage) + 1} / {allImages.length}
          </span>
        </div>
      )}

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
            {t("Property Video")}
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

            {t("Your browser does not support video playback.")}

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
            📍 {t("Property Location")}
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
              🗺️ {t("Open in Google Maps")}
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
            📍 {t("Property Location")}
          </h2>

          <p>
            {t("Location coordinates are not available for this property.")}
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
              🗺️ {t("Open in Google Maps")}
            </a>
          )}

        </div>
      )}

      {/* ==============================
          COORDINATES
      ============================== */}
{/* 
      {hasCoordinates && (
        <div
          className="details-container"
          style={{
            marginTop: "30px",
            display: "block",
          }}
        >

          <h2>
            {t("Property Coordinates")}
          </h2>

          <p>
            <strong>
              {t("Latitude")}:
            </strong>{" "}
            {latitude}
          </p>

          <p>
            <strong>
              {t("Longitude")}:
            </strong>{" "}
            {longitude}
          </p>

        </div>
      )} */}

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
                  {t("HOME BOOKING")}
                </span>

                <h2>
                  {t("Book This Property")}
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
                  {t("Property Type")}:
                </strong>{" "}
                {t(property.property_type || "Property")}
              </p>

              <p>
                <strong>
                  {t("Location")}:
                </strong>{" "}
                {property.location}
              </p>

              <div className="booking-property-grid">

                <div>

                  <span>
                    {t("Bedrooms")}
                  </span>

                  <strong>
                    {property.bedrooms ?? 0}
                  </strong>

                </div>

                <div>

                  <span>
                    {t("Bathrooms")}
                  </span>

                  <strong>
                    {property.bathrooms ?? 0}
                  </strong>

                </div>

                <div>

                  <span>
                    {t("Area")}
                  </span>

                  <strong>
                    {property.area_sqft ?? 0} {t("Sq. Ft.")}
                  </strong>

                </div>

              </div>

            </div>

            {/* ==============================
                PAYMENT INFORMATION
            ============================== */}

            <div className="booking-payment">

              <h3>
                {t("Payment Details")}
              </h3>

              <div className="booking-payment-row">

                <span>
                  {t("Total Payment")}
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
                  {t("Advance Payment (10%)")}
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
                  {t("Remaining Payment")}
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
                {t("Contact Information")}
              </h3>

              <p>
                {t("Please provide your details. Our team will contact you regarding this property.")}
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
                  placeholder={t("Your Name")}
                  required
                />

                <input
                  type="email"
                  name="email"
                  placeholder={t("Your Email")}
                  required
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder={t("Your Phone")}
                  required
                />

                <textarea
                  name="message"
                  rows="4"
                  required
                  defaultValue={`${t("I am interested in")} ${property.title}. ${t("I would like to know more about the booking process, payment options and availability.")}`}
                />

                <div className="booking-popup-actions">

                  <button
                    type="button"
                    className="booking-cancel-btn"
                    onClick={() =>
                      setShowBookingPopup(false)
                    }
                  >
                    {t("Cancel")}
                  </button>

                  <button
                    type="submit"
                    className="booking-submit-btn"
                    disabled={enquiryLoading}
                  >
                    {enquiryLoading
                      ? t("Submitting...")
                      : t("Submit Enquiry")}
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