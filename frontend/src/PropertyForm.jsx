import React, { useState } from "react";

// const API_URL = "http://localhost:5000/api";
// const SERVER_URL = "http://localhost:5000";
const API_URL = "https://house-selling-website.onrender.com/api";
const SERVER_URL = "https://house-selling-website.onrender.com";
function PropertyForm({ property, onClose, onSuccess }) {
  const isEditing = Boolean(property);

  const [formData, setFormData] = useState({
    title: property?.title || "",
    property_type: property?.property_type || "House",
    location: property?.location || "",
    price: property?.price || "",
    bedrooms: property?.bedrooms || "",
    bathrooms: property?.bathrooms || "",
    area_sqft: property?.area_sqft || "",
    description: property?.description || "",

    // Main image
    image: null,

    // Additional images
    images: [],

    // Video
    video: null,

    // Google Maps
    map_location: property?.map_location || "",
    latitude:
      property?.latitude !== null &&
      property?.latitude !== undefined
        ? property.latitude
        : "",
    longitude:
      property?.longitude !== null &&
      property?.longitude !== undefined
        ? property.longitude
        : "",
  });

  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);

  // --------------------------------------------------
  // EXTRACT LATITUDE AND LONGITUDE FROM GOOGLE MAPS URL
  // --------------------------------------------------

  const extractCoordinates = (url) => {
    if (!url) return null;

    const patterns = [
      // Example:
      // https://www.google.com/maps/@20.123456,74.123456,17z
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,

      // Example:
      // https://www.google.com/maps?q=20.123456,74.123456
      /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,

      // Google Maps internal format
      // !3d20.123456!4d74.123456
      /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,

      // Example:
      // /20.123456,74.123456
      /\/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:[/?]|$)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);

      if (match) {
        return {
          latitude: Number(match[1]),
          longitude: Number(match[2]),
        };
      }
    }

    return null;
  };

  // --------------------------------------------------
  // NORMAL FORM CHANGE
  // --------------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // GOOGLE MAP LOCATION CHANGE
  // --------------------------------------------------

  const handleMapLocationChange = (e) => {
    const value = e.target.value;

    const coordinates = extractCoordinates(value);

    if (coordinates) {
      setFormData((previous) => ({
        ...previous,
        map_location: value,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }));
    } else {
      setFormData((previous) => ({
        ...previous,
        map_location: value,
      }));
    }
  };

  // --------------------------------------------------
  // DETECT GOOGLE MAP COORDINATES
  // --------------------------------------------------

  const detectMapCoordinates = async () => {
    const url = formData.map_location.trim();

    if (!url) {
      alert("Please paste a Google Maps link first.");
      return;
    }

    // First try to extract coordinates directly
    const directCoordinates = extractCoordinates(url);

    if (directCoordinates) {
      setFormData((previous) => ({
        ...previous,
        latitude: directCoordinates.latitude,
        longitude: directCoordinates.longitude,
      }));

      alert("Location coordinates detected successfully.");
      return;
    }

    // For shortened Google Maps links
    if (
      url.includes("maps.app.goo.gl") ||
      url.includes("goo.gl/maps")
    ) {
      try {
        setMapLoading(true);

        const response = await fetch(
          `${API_URL}/map/coordinates`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: url,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to detect coordinates from Google Maps link."
          );
        }

        setFormData((previous) => ({
          ...previous,
          latitude: data.latitude,
          longitude: data.longitude,
        }));

        alert("Location detected successfully.");
      } catch (error) {
        console.error("Google Maps error:", error);

        alert(
          error.message ||
            "Could not detect location from this Google Maps link."
        );
      } finally {
        setMapLoading(false);
      }

      return;
    }

    alert(
      "Please enter a valid Google Maps URL or Google Maps short link."
    );
  };

  // --------------------------------------------------
  // MAIN IMAGE
  // --------------------------------------------------

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setFormData((previous) => ({
      ...previous,
      image: file,
    }));
  };

  // --------------------------------------------------
  // MULTIPLE IMAGES
  // --------------------------------------------------

  const handleMultipleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);

    setFormData((previous) => ({
      ...previous,
      images: files,
    }));
  };

  // --------------------------------------------------
  // VIDEO
  // --------------------------------------------------

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setFormData((previous) => ({
      ...previous,
      video: file,
    }));
  };

  // --------------------------------------------------
  // UPLOAD FILE
  // --------------------------------------------------

  // const uploadFile = async (file, fieldName) => {
  //   if (!(file instanceof File)) {
  //     return "";
  //   }

  //   const uploadData = new FormData();

  //   uploadData.append(fieldName, file);

  //   const response = await fetch(
  //     `${SERVER_URL}/api/upload`,
  //     {
  //       method: "POST",
  //       body: uploadData,
  //     }
  //   );

  //   const data = await response.json();

  //   if (!response.ok) {
  //     throw new Error(
  //       data.message || "File upload failed."
  //     );
  //   }

  //   return (
  //     data.image ||
  //     data.imageUrl ||
  //     data.video ||
  //     data.videoUrl ||
  //     data.url ||
  //     ""
  //   );
  // };

  
const uploadFile = async (file, fieldName) => {
  if (!(file instanceof File)) {
    return "";
  }

  const token = localStorage.getItem("token");
  const uploadData = new FormData();
  uploadData.append(fieldName, file);

  // Images are stored in MongoDB.
  // Videos continue using the existing disk upload route.
  const uploadUrl =
    fieldName === "video"
      ? `${SERVER_URL}/api/upload`
      : `${API_URL}/database-images`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: uploadData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "File upload failed.");
  }

  if (fieldName === "video") {
    return data.video || data.videoUrl || data.url || "";
  }

  const imagePath = data.image || data.url || "";

  if (!imagePath) {
    throw new Error("Image URL was not returned by the server.");
  }

  return imagePath.startsWith("http")
    ? imagePath
    : `${SERVER_URL}${imagePath}`;
};


  // --------------------------------------------------
  // UPLOAD MAIN IMAGE
  // --------------------------------------------------

  const uploadMainImage = async () => {
    if (!(formData.image instanceof File)) {
      return property?.image || "";
    }

    return await uploadFile(formData.image, "image");
  };

  // --------------------------------------------------
  // UPLOAD ADDITIONAL IMAGES
  // --------------------------------------------------

  const uploadAdditionalImages = async () => {
    if (!formData.images || formData.images.length === 0) {
      return Array.isArray(property?.images)
        ? property.images
        : [];
    }

    const uploadedImages = [];

    for (const file of formData.images) {
      const uploadedUrl = await uploadFile(
        file,
        "image"
      );

      if (uploadedUrl) {
        uploadedImages.push(uploadedUrl);
      }
    }

    return uploadedImages;
  };

  // --------------------------------------------------
  // UPLOAD VIDEO
  // --------------------------------------------------

  const uploadVideo = async () => {
    if (!(formData.video instanceof File)) {
      return property?.video || "";
    }

    return await uploadFile(formData.video, "video");
  };

  // --------------------------------------------------
  // SUBMIT FORM
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      return;
    }

    // Basic validation
    if (!formData.title.trim()) {
      alert("Please enter property title.");
      return;
    }

    if (!formData.location.trim()) {
      alert("Please enter property location.");
      return;
    }

    if (!formData.price) {
      alert("Please enter property price.");
      return;
    }

    try {
      setLoading(true);

      // -----------------------------------------------
      // UPLOAD FILES
      // -----------------------------------------------

      const imageUrl = await uploadMainImage();

      const imageUrls = await uploadAdditionalImages();

      const videoUrl = await uploadVideo();

      // -----------------------------------------------
      // PROPERTY DATA
      // -----------------------------------------------

      const propertyData = {
        title: formData.title.trim(),

        property_type: formData.property_type,

        location: formData.location.trim(),

        price: Number(formData.price),

        bedrooms: Number(formData.bedrooms || 0),

        bathrooms: Number(formData.bathrooms || 0),

        area_sqft: Number(formData.area_sqft || 0),

        description: formData.description.trim(),

        image: imageUrl,

        images: imageUrls,

        video: videoUrl,

        map_location:
          formData.map_location?.trim() || "",

        latitude:
          formData.latitude !== "" &&
          formData.latitude !== null &&
          formData.latitude !== undefined
            ? Number(formData.latitude)
            : null,

        longitude:
          formData.longitude !== "" &&
          formData.longitude !== null &&
          formData.longitude !== undefined
            ? Number(formData.longitude)
            : null,
      };

      console.log(
        "Property data:",
        propertyData
      );

      // -----------------------------------------------
      // ADD OR UPDATE
      // -----------------------------------------------

      const url = isEditing
        ? `${API_URL}/properties/${property._id}`
        : `${API_URL}/properties`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(propertyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Property operation failed."
        );
      }

      // -----------------------------------------------
      // SUCCESS
      // -----------------------------------------------

      alert(
        isEditing
          ? "Property updated successfully."
          : "Property added successfully."
      );

      if (onSuccess) {
        onSuccess(data);
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error(
        "Property operation error:",
        error
      );

      alert(
        error.message ||
          "Something went wrong while saving property."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // CLOSE MODAL
  // --------------------------------------------------

  const handleClose = () => {
    if (loading || mapLoading) {
      return;
    }

    if (onClose) {
      onClose();
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div
      className="admin-modal-overlay"
      onClick={handleClose}
    >
      <div
        className="admin-modal property-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}

        <div className="admin-modal-header">
          <div>
            <span className="admin-modal-label">
              PROPERTY MANAGEMENT
            </span>

            <h2>
              {isEditing
                ? "Update Property"
                : "Add New Property"}
            </h2>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={handleClose}
            disabled={loading || mapLoading}
          >
            X
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="admin-property-form"
        >
          <div className="admin-form-grid">

            {/* PROPERTY TITLE */}

            <div className="admin-form-group full">
              <label>Property Title</label>

              <input
                type="text"
                name="title"
                placeholder="Enter property title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* PROPERTY TYPE */}

            <div className="admin-form-group">
              <label>Property Type</label>

              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleChange}
                required
              >
                <option value="House">
                  House
                </option>

                <option value="Penthouse">
                  Penthouse
                </option>

                <option value="Villa">
                  Villa
                </option>

                <option value="Plot">
                  Plot
                </option>

                <option value="Commercial">
                  Commercial
                </option>
              </select>
            </div>

            {/* LOCATION */}

            <div className="admin-form-group">
              <label>Location</label>

              <input
                type="text"
                name="location"
                placeholder="Property location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            {/* PRICE */}

            <div className="admin-form-group">
              <label>Price</label>

              <input
                type="number"
                name="price"
                placeholder="Property price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                required
              />
            </div>

            {/* BEDROOMS */}

            <div className="admin-form-group">
              <label>Bedrooms</label>

              <input
                type="number"
                name="bedrooms"
                placeholder="Number of bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                min="0"
                required
              />
            </div>

            {/* BATHROOMS */}

            <div className="admin-form-group">
              <label>Bathrooms</label>

              <input
                type="number"
                name="bathrooms"
                placeholder="Number of bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                min="0"
                required
              />
            </div>

            {/* AREA */}

            <div className="admin-form-group">
              <label>Area (sq.ft)</label>

              <input
                type="number"
                name="area_sqft"
                placeholder="Area in square feet"
                value={formData.area_sqft}
                onChange={handleChange}
                min="0"
              />
            </div>

            {/* MAIN IMAGE */}

            <div className="admin-form-group full">
              <label>
                Main Property Photo
              </label>

              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageChange}
              />

              {property?.image && (
                <small>
                  Existing main image will remain if
                  you do not select a new image.
                </small>
              )}

              {formData.image instanceof File && (
                <small>
                  New image selected:{" "}
                  {formData.image.name}
                </small>
              )}
            </div>

            {/* MULTIPLE IMAGES */}

            <div className="admin-form-group full">
              <label>
                Additional Property Photos
              </label>

              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                multiple
                onChange={
                  handleMultipleImagesChange
                }
              />

              <small>
                You can select multiple property
                photos.
              </small>

              {formData.images.length > 0 && (
                <small>
                  {formData.images.length} new
                  image(s) selected.
                </small>
              )}

              {isEditing &&
                Array.isArray(property?.images) &&
                property.images.length > 0 && (
                  <small>
                    Existing gallery images:
                    {" "}
                    {property.images.length}
                  </small>
                )}
            </div>

            {/* VIDEO */}

            <div className="admin-form-group full">
              <label>
                Property Video
              </label>

              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg"
                onChange={handleVideoChange}
              />

              {property?.video && (
                <small>
                  Existing video will remain if
                  you do not select a new video.
                </small>
              )}

              {formData.video instanceof File && (
                <small>
                  New video selected:{" "}
                  {formData.video.name}
                </small>
              )}
            </div>

            {/* GOOGLE MAPS */}

            <div className="admin-form-group full">
              <label>
                Google Maps Location
              </label>

              <input
                type="text"
                name="map_location"
                placeholder="Paste Google Maps URL"
                value={formData.map_location}
                onChange={
                  handleMapLocationChange
                }
              />

              <small>
                Example:
                {" "}
                https://maps.app.goo.gl/2KZ8Joy8c45w19it5
              </small>

              <button
                type="button"
                className="detect-location-button"
                onClick={detectMapCoordinates}
                disabled={
                  mapLoading ||
                  !formData.map_location.trim()
                }
              >
                {mapLoading
                  ? "Detecting Location..."
                  : "Detect Location"}
              </button>

              {/* COORDINATES */}

              {formData.latitude !== "" &&
                formData.longitude !== "" && (
                  <div className="map-coordinate-box">
                    <small>
                      Location detected successfully.
                    </small>

                    <div>
                      <strong>
                        Latitude:
                      </strong>{" "}
                      {formData.latitude}
                    </div>

                    <div>
                      <strong>
                        Longitude:
                      </strong>{" "}
                      {formData.longitude}
                    </div>
                  </div>
                )}

              {/* NO COORDINATES */}

              {formData.map_location &&
                formData.latitude === "" &&
                formData.longitude === "" && (
                  <small>
                    Click "Detect Location" to get
                    latitude and longitude.
                  </small>
                )}
            </div>

            {/* MANUAL LATITUDE */}

            <div className="admin-form-group">
              <label>
                Latitude
              </label>

              <input
                type="number"
                step="any"
                name="latitude"
                placeholder="Example: 20.123456"
                value={formData.latitude}
                onChange={handleChange}
              />
            </div>

            {/* MANUAL LONGITUDE */}

            <div className="admin-form-group">
              <label>
                Longitude
              </label>

              <input
                type="number"
                step="any"
                name="longitude"
                placeholder="Example: 74.123456"
                value={formData.longitude}
                onChange={handleChange}
              />
            </div>

            {/* DESCRIPTION */}

            <div className="admin-form-group full">
              <label>
                Property Description
              </label>

              <textarea
                name="description"
                placeholder="Write property description"
                rows="6"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* BUTTONS */}

          <div className="admin-modal-actions">

            <button
              type="button"
              className="admin-secondary-button"
              onClick={handleClose}
              disabled={loading || mapLoading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={loading || mapLoading}
            >
              {loading
                ? "Saving..."
                : isEditing
                ? "Update Property"
                : "Publish Property"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

export default PropertyForm;