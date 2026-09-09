import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./App.css";

const API_URL = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

function App() {
  return <HomePage />;
}

function HomePage() {
  const navigate = useNavigate();

  // =====================================================
  // USER
  // =====================================================

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
  });

  // =====================================================
  // PROPERTIES
  // =====================================================

  const [properties, setProperties] = useState([]);

  // =====================================================
  // WISHLIST
  // =====================================================

  const [wishlist, setWishlist] = useState([]);

  // =====================================================
  // SEARCH / FILTER
  // =====================================================

  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // =====================================================
  // ADMIN FORM
  // =====================================================

  const emptyForm = {
    title: "",
    property_type: "House",
    location: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    area_sqft: "",
    description: "",
    image: null,
    images: [],
    video: null,
    latitude: "",
    longitude: "",
    map_location: "",
  };

  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // =====================================================
  // EXTRACT LATITUDE & LONGITUDE FROM GOOGLE MAPS URL
  // =====================================================

const extractCoordinates = (url) => {
  if (!url) {
    return {
      latitude: "",
      longitude: "",
    };
  }

  const match = url.match(
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/
  );

  if (match) {
    return {
      latitude: Number(match[1]),
      longitude: Number(match[2]),
    };
  }

  return {
    latitude: "",
    longitude: "",
  };
};

  // =====================================================
  // FETCH PROPERTIES
  // =====================================================

  const fetchProperties = async (retryCount = 0) => {
    try {
      console.log("Fetching properties...");

      const response = await fetch(`${API_URL}/properties`);

      const data = await response.json();

      console.log("Properties received:", data);

      if (!response.ok) {
        console.error("Properties API error:", data);

        if (retryCount < 3) {
          setTimeout(() => {
            fetchProperties(retryCount + 1);
          }, 1000);
        }

        return;
      }

      if (!Array.isArray(data)) {
        console.error("Expected array:", data);
        setProperties([]);
        return;
      }

      setProperties(data);
    } catch (error) {
      console.error("Failed to fetch properties:", error);

      if (retryCount < 3) {
        setTimeout(() => {
          fetchProperties(retryCount + 1);
        }, 1000);
      }
    }
  };

  // =====================================================
  // FETCH WISHLIST
  // =====================================================

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token || user?.role !== "buyer") {
        setWishlist([]);
        return;
      }

      const response = await fetch(`${API_URL}/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setWishlist(Array.isArray(data) ? data : []);
      } else {
        console.error(data);
      }
    } catch (error) {
      console.error("Wishlist error:", error);
    }
  };

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (user?.role === "buyer") {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [user]);

  // =====================================================
  // ADD WISHLIST
  // =====================================================

  const addToWishlist = async (propertyId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first.");
        return;
      }

      const response = await fetch(
        `${API_URL}/wishlist/${propertyId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to add property.");
        return;
      }

      await fetchWishlist();

      alert("Property added to Favorites ❤️");
    } catch (error) {
      console.error(error);
      alert("Unable to add property to Favorites.");
    }
  };

  // =====================================================
  // REMOVE WISHLIST
  // =====================================================

  const removeFromWishlist = async (propertyId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first.");
        return;
      }

      const response = await fetch(
        `${API_URL}/wishlist/${propertyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to remove property.");
        return;
      }

      await fetchWishlist();

      alert("Property removed from wishlist.");
    } catch (error) {
      console.error(error);
      alert("Unable to remove property.");
    }
  };

  // =====================================================
  // CHECK WISHLIST
  // =====================================================

  const isWishlisted = (propertyId) => {
    return wishlist.some((item) => {
      const wishlistPropertyId =
        item.property?._id ||
        item.property ||
        item.propertyId;

      return String(wishlistPropertyId) === String(propertyId);
    });
  };

  // =====================================================
  // UPDATE PROPERTY STATUS
  // =====================================================

  const updatePropertyStatus = async (
    propertyId,
    newStatus
  ) => {
    if (user?.role !== "admin") {
      alert("Only admin can change property status.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/properties/${propertyId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        alert("Session expired.");
        handleLogout();
        return;
      }

      if (!response.ok) {
        alert(
          data.message ||
            data.error ||
            "Failed to update status."
        );
        return;
      }

      setProperties((previous) =>
        previous.map((property) =>
          property._id === propertyId
            ? data.property
            : property
        )
      );

      alert(`Property status changed to ${newStatus}`);
    } catch (error) {
      console.error(error);
      alert("Backend connection failed.");
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setWishlist([]);
    setEditingId(null);
    setFormData({ ...emptyForm });

    // Keep properties visible after logout
    fetchProperties();
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

const handleChange = async (e) => {
  const { name, value } = e.target;

  // ===================================================
  // GOOGLE MAPS LOCATION
  // ===================================================

  if (name === "map_location") {
    // First save the URL
    setFormData((previous) => ({
      ...previous,
      map_location: value,
    }));

    // Empty URL
    if (!value.trim()) {
      setFormData((previous) => ({
        ...previous,
        map_location: "",
        latitude: "",
        longitude: "",
      }));

      return;
    }

    // =================================================
    // TRY FRONTEND EXTRACTION FIRST
    // =================================================

    const coordinates = extractCoordinates(value);

    if (
      coordinates.latitude !== "" &&
      coordinates.longitude !== ""
    ) {
      setFormData((previous) => ({
        ...previous,
        map_location: value,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }));

      return;
    }

    // =================================================
    // TRY BACKEND FOR SHORT GOOGLE MAPS URL
    // =================================================

    if (
      value.includes("maps.app.goo.gl") ||
      value.includes("goo.gl/maps")
    ) {
      try {
        const response = await fetch(
          `${API_URL}/map/coordinates`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: value,
            }),
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setFormData((previous) => ({
            ...previous,
            map_location: value,
            latitude: data.latitude,
            longitude: data.longitude,
          }));

          console.log(
            "Coordinates found:",
            data.latitude,
            data.longitude
          );
        } else {
          console.log(
            "Coordinates not found:",
            data.message
          );
        }
      } catch (error) {
        console.error(
          "Map coordinate request failed:",
          error
        );
      }
    }

    return;
  }

  // ===================================================
  // NORMAL FORM FIELDS
  // ===================================================

  setFormData((previous) => ({
    ...previous,
    [name]: value,
  }));
};

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
  };

  // =====================================================
  // UPLOAD FILE
  // =====================================================

  const uploadFile = async (file, fieldName) => {
    if (!(file instanceof File)) {
      return "";
    }

    const uploadFormData = new FormData();

    uploadFormData.append(fieldName, file);

    console.log(
      `Uploading ${fieldName}:`,
      file.name,
      file.type,
      file.size
    );

    const response = await fetch(
      `${SERVER_URL}/api/upload`,
      {
        method: "POST",
        body: uploadFormData,
      }
    );

    let data;

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    console.log(
      `Upload response for ${fieldName}:`,
      data
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
          data.error ||
          `${fieldName} upload failed.`
      );
    }

    return (
      data[fieldName] ||
      data.image ||
      data.video ||
      data.url ||
      data.imageUrl ||
      data.videoUrl ||
      ""
    );
  };

  // =====================================================
  // ADD / UPDATE PROPERTY
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (user?.role !== "admin") {
      alert("Only admin can manage properties.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      return;
    }

    try {
      // MAIN IMAGE

      let imageUrl =
        typeof formData.image === "string"
          ? formData.image
          : "";

      if (formData.image instanceof File) {
        imageUrl = await uploadFile(
          formData.image,
          "image"
        );
      }

      // ADDITIONAL IMAGES

      let imageUrls = [];

      if (
        editingId &&
        Array.isArray(formData.images)
      ) {
        imageUrls = formData.images.filter(
          (image) => typeof image === "string"
        );
      }

      const newImageFiles = Array.isArray(
        formData.images
      )
        ? formData.images.filter(
            (image) => image instanceof File
          )
        : [];

      for (const file of newImageFiles) {
        const uploadedUrl = await uploadFile(
          file,
          "image"
        );

        if (uploadedUrl) {
          imageUrls.push(uploadedUrl);
        }
      }

      // VIDEO

      let videoUrl =
        typeof formData.video === "string"
          ? formData.video
          : "";

      if (formData.video instanceof File) {
        videoUrl = await uploadFile(
          formData.video,
          "video"
        );
      }

      // PROPERTY DATA

      const propertyData = {
        title: formData.title.trim(),

        property_type: formData.property_type,

        location: formData.location.trim(),

        price: Number(formData.price),

        bedrooms: Number(formData.bedrooms),

        bathrooms: Number(formData.bathrooms),

        area_sqft: Number(
          formData.area_sqft || 0
        ),

        description:
          formData.description.trim(),

        image: imageUrl,

        images: imageUrls,

        video: videoUrl,

        map_location:
          formData.map_location || "",

        latitude:
          formData.latitude !== "" &&
          formData.latitude !== null
            ? Number(formData.latitude)
            : null,

        longitude:
          formData.longitude !== "" &&
          formData.longitude !== null
            ? Number(formData.longitude)
            : null,
      };

      console.log(
        "Property data being sent:",
        propertyData
      );

      // URL

      const url = editingId
        ? `${API_URL}/properties/${editingId}`
        : `${API_URL}/properties`;

      // REQUEST

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(propertyData),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      // SESSION

      if (response.status === 401) {
        alert("Session expired.");
        handleLogout();
        return;
      }

      // ERROR

      if (!response.ok) {
        alert(
          data.error ||
            data.message ||
            "Property operation failed."
        );
        return;
      }

      // SUCCESS

      alert(
        editingId
          ? "Property updated successfully."
          : "Property added successfully."
      );

      resetForm();

      await fetchProperties();

      setTimeout(() => {
        document
          .getElementById("properties")
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }, 200);
    } catch (error) {
      console.error(
        "Property submit error:",
        error
      );

      alert(
        error.message ||
          "Backend connection failed."
      );
    }
  };

  // =====================================================
  // EDIT PROPERTY
  // =====================================================

 const handleEdit = (property) => {
  if (user?.role !== "admin") {
    alert("Only admin can edit properties.");
    return;
  }

  setEditingId(property._id);

  setFormData({
    title: property.title || "",

    property_type:
      property.property_type || "House",

    location: property.location || "",

    price: property.price ?? "",

    bedrooms: property.bedrooms ?? "",

    bathrooms: property.bathrooms ?? "",

    area_sqft: property.area_sqft ?? "",

    description:
      property.description || "",

    image:
      property.image || "",

    images:
      Array.isArray(property.images)
        ? property.images
        : [],

    video:
      property.video || "",

    latitude:
      property.latitude ?? "",

    longitude:
      property.longitude ?? "",

    map_location:
      property.map_location || "",
  });

  setTimeout(() => {
    document
      .getElementById("add-property")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }, 100);
};

  // =====================================================
  // DELETE PROPERTY
  // =====================================================

  const handleDelete = async (id) => {
    if (user?.role !== "admin") {
      alert("Only admin can delete properties.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this property?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/properties/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        alert("Session expired.");
        handleLogout();
        return;
      }

      if (!response.ok) {
        alert(
          data.error ||
            data.message ||
            "Failed to delete property."
        );
        return;
      }

      await fetchProperties();

      alert("Property deleted successfully.");
    } catch (error) {
      console.error(error);

      alert("Backend connection failed.");
    }
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredProperties =
    properties.filter((property) => {
      const searchText =
        search.toLowerCase().trim();

      const title =
        property.title?.toLowerCase() || "";

      const location =
        property.location?.toLowerCase() || "";

      const propertyTypeText =
        property.property_type?.toLowerCase() ||
        "";

      const matchesSearch =
        searchText === "" ||
        title.includes(searchText) ||
        location.includes(searchText) ||
        propertyTypeText.includes(searchText);

      const matchesType =
        propertyType === "All" ||
        property.property_type === propertyType;

      const matchesPrice =
        maxPrice === "" ||
        Number(property.price) <=
          Number(maxPrice);

      const matchesStatus =
        statusFilter === "All" ||
        property.status === statusFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesPrice &&
        matchesStatus
      );
    });

  // =====================================================
  // VIEW DETAILS
  // =====================================================

  const handleViewDetails = (property) => {
    navigate(`/property/${property._id}`);
  };

  // =====================================================
  // MAIN WEBSITE
  // =====================================================

  return (
    <div className="app">

      {/* =================================================
          ADMIN DASHBOARD
      ================================================= */}

      {user?.role === "admin" && (
        <section className="admin-header">

          <div className="section-container">

            <div>

              <span className="section-label">
                ADMINISTRATION
              </span>

              <h1>
                Admin Dashboard
              </h1>

              <p>
                Manage properties and
                maintain the HomeFinder
                platform.
              </p>

            </div>

            <div className="admin-stats">

              <div className="stat-card">
                <strong>
                  {properties.length}
                </strong>

                <span>
                  Total Properties
                </span>
              </div>

              <div className="stat-card">
                <strong>
                  {
                    properties.filter(
                      (p) =>
                        p.property_type ===
                        "House"
                    ).length
                  }
                </strong>

                <span>
                  Houses
                </span>
              </div>

              <div className="stat-card">
                <strong>
                  {
                    properties.filter(
                      (p) =>
                        p.property_type ===
                        "Villa"
                    ).length
                  }
                </strong>

                <span>
                  Villas
                </span>
              </div>

              <div className="stat-card">
                <strong>
                  {
                    properties.filter(
                      (p) =>
                        p.property_type ===
                        "Plot"
                    ).length
                  }
                </strong>

                <span>
                  Plots
                </span>
              </div>

              <div className="stat-card">
                <strong>
                  {
                    properties.filter(
                      (p) =>
                        p.status ===
                        "Available"
                    ).length
                  }
                </strong>

                <span>
                  Available
                </span>
              </div>

              <div className="stat-card">
                <strong>
                  {
                    properties.filter(
                      (p) =>
                        p.status ===
                        "Sold"
                    ).length
                  }
                </strong>

                <span>
                  Sold
                </span>
              </div>

            </div>

          </div>

        </section>
      )}

      {/* =================================================
          HERO
      ================================================= */}

      <section
        className="hero"
        id="home"
      >

        <div className="hero-overlay"></div>

        <div className="hero-content">

          <span className="hero-label">
            FIND A PLACE TO CALL HOME
          </span>

          <h1>
            Discover a Home
            <br />
            Designed for Your Life
          </h1>

          <p>
            Explore carefully selected
            homes, villas, apartments
            and plots in desirable
            locations.
          </p>

          <div className="hero-buttons">

            <a
              href="#properties"
              className="hero-button"
            >
              Explore Properties
            </a>

            <a
              href="/contact"
              className="hero-outline-button"
            >
              Contact Us
            </a>

          </div>

        </div>

      </section>

      {/* =================================================
          INTRO
      ================================================= */}

      <section className="intro-section">

        <div className="intro-container">

          <div className="intro-text">

            <span className="section-label">
              WELCOME TO HOMEFINDER
            </span>

            <h2>
              A Better Way to Find
              Your Next Property
            </h2>

          </div>

          <div className="intro-description">

            <p>
              HomeFinder brings properties,
              projects and professional
              construction services together
              in one convenient platform.
            </p>

            <a
              href="#about"
              className="text-link"
            >
              Learn More About Us
            </a>

          </div>

        </div>

      </section>

      {/* =================================================
          PROPERTIES
      ================================================= */}

      <section
        className="properties-section"
        id="properties"
      >

        <div className="section-container">

          <div className="section-heading">

            <div>

              <span className="section-label">
                OUR PROPERTIES
              </span>

              <h2>
                Featured Properties
              </h2>

            </div>

            <p>
              Explore our available
              residential and commercial
              properties.
            </p>

          </div>

          {/* SEARCH */}

          <div className="search-panel">

            <div className="search-field">

              <label>
                Search
              </label>

              <input
                type="text"
                placeholder="Search title or location"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            <div className="search-field">

              <label>
                Property Type
              </label>

              <select
                value={propertyType}
                onChange={(e) =>
                  setPropertyType(e.target.value)
                }
              >

                <option value="All">
                  All Types
                </option>

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

            <div className="search-field">

              <label>
                Maximum Price
              </label>

              <input
                type="number"
                placeholder="Maximum price"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(e.target.value)
                }
                min="0"
              />

            </div>

            {user?.role === "admin" && (
              <div className="search-field">

                <label>
                  Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                >

                  <option value="All">
                    All Status
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Available">
                    Available
                  </option>

                  <option value="Sold">
                    Sold
                  </option>

                  <option value="Rejected">
                    Rejected
                  </option>

                </select>

              </div>
            )}

            <button
              className="clear-button"
              onClick={() => {
                setSearch("");
                setPropertyType("All");
                setMaxPrice("");
                setStatusFilter("All");
              }}
            >
              Clear Filters
            </button>

          </div>

          <p className="property-count">
            Showing{" "}
            <strong>
              {filteredProperties.length}
            </strong>{" "}
            properties
          </p>

          {/* PROPERTY GRID */}

          <div className="property-container">

            {filteredProperties.length === 0 ? (
              <div className="no-properties">

                <h3>
                  No Properties Found
                </h3>

                <p>
                  Try changing your search
                  or filter criteria.
                </p>

              </div>
            ) : (
              filteredProperties.map(
                (property) => (

                  <article
                    className="property-card"
                    key={property._id}
                  >

                    {/* IMAGE */}

                    <div className="property-image-wrapper">

                      {property.image ? (
                        <img
                          src={
                            property.image.startsWith(
                              "http"
                            )
                              ? property.image
                              : `${SERVER_URL}${
                                  property.image.startsWith(
                                    "/"
                                  )
                                    ? ""
                                    : "/"
                                }${property.image}`
                          }
                          alt={property.title}
                          className="property-image"
                          onError={(e) => {
                            e.currentTarget.style.display =
                              "none";

                            const fallback =
                              e.currentTarget
                                .nextElementSibling;

                            if (fallback) {
                              fallback.style.display =
                                "flex";
                            }
                          }}
                        />
                      ) : null}

                      <div
                        className="no-image"
                        style={{
                          display:
                            property.image
                              ? "none"
                              : "flex",
                        }}
                      >
                        Property Image
                      </div>

                      <span className="property-badge-static">
                        {property.property_type}
                      </span>

                      <span
                        className={`property-status ${
                          (
                            property.status ||
                            "Pending"
                          ).toLowerCase()
                        }`}
                      >
                        {property.status ||
                          "Pending"}
                      </span>

                    </div>

                    {/* PROPERTY INFORMATION */}

                    <div className="property-info">

                      <p className="property-location">
                        {property.location}
                      </p>

                      <h3>
                        {property.title}
                      </h3>

                      <p className="property-price">
                        ₹
                        {Number(
                          property.price
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>

                      <div className="property-meta">

                        <span>
                          {property.bedrooms || 0}{" "}
                          Bedrooms
                        </span>

                        <span>
                          {property.bathrooms || 0}{" "}
                          Bathrooms
                        </span>

                        <span>
                          {property.area_sqft || 0}{" "}
                          sq.ft
                        </span>

                      </div>

                      {property.description && (
                        <p className="property-description">
                          {property.description}
                        </p>
                      )}

                      {/* =================================
                          BUYER / PUBLIC ACTIONS
                      ================================= */}

                      {user?.role === "buyer" ? (

                        <div className="buyer-property-actions">

                          {/* VIEW DETAILS */}

                          <button
                            className="view-button"
                            onClick={() =>
                              handleViewDetails(
                                property
                              )
                            }
                          >
                            View Details
                          </button>

                          {/* WISHLIST */}

                          <button
                            className={
                              isWishlisted(
                                property._id
                              )
                                ? "wishlist-button active"
                                : "wishlist-button"
                            }
                            onClick={() => {
                              if (
                                isWishlisted(
                                  property._id
                                )
                              ) {
                                removeFromWishlist(
                                  property._id
                                );
                              } else {
                                addToWishlist(
                                  property._id
                                );
                              }
                            }}
                          >
                            {isWishlisted(
                              property._id
                            )
                              ? "♥ Saved"
                              : "♡ Wishlist"}
                          </button>

                        </div>

                      ) : (

                        /* LOGGED OUT / ADMIN */

                        <div className="public-property-actions">

                          <button
                            className="view-button"
                            onClick={() =>
                              handleViewDetails(
                                property
                              )
                            }
                          >
                            View Details
                          </button>

                        </div>

                      )}

                      {/* =================================
                          ADMIN ACTIONS
                      ================================= */}

                      {user?.role === "admin" && (
                        <div className="admin-property-actions">

                          <div className="status-control">

                            <label>
                              Status
                            </label>

                            <select
                              value={
                                property.status ||
                                "Pending"
                              }
                              onChange={(e) =>
                                updatePropertyStatus(
                                  property._id,
                                  e.target.value
                                )
                              }
                            >

                              <option value="Pending">
                                Pending
                              </option>

                              <option value="Available">
                                Available
                              </option>

                              <option value="Sold">
                                Sold
                              </option>

                              <option value="Rejected">
                                Rejected
                              </option>

                            </select>

                          </div>

                          <button
                            className="edit-button"
                            onClick={() =>
                              handleEdit(
                                property
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              handleDelete(
                                property._id
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>
                      )}

                    </div>

                  </article>

                )
              )
            )}

          </div>

        </div>

      </section>

      {/* =================================================
          WISHLIST
      ================================================= */}

      {user?.role === "buyer" && (
        <section
          className="wishlist-section"
          id="wishlist"
        >

          <div className="section-container">

            <div className="section-heading">

              <div>

                <h2>
                  My Favorites
                </h2>

              </div>

              <p>
                Properties you have saved
                for later.
              </p>

            </div>

            {wishlist.length === 0 ? (

              <div className="no-properties">

                <h3>
                  Your wishlist is empty
                </h3>

                <p>
                  Save properties you like
                  and find them here later.
                </p>

                <a
                  href="#properties"
                  className="view-button"
                >
                  Explore Properties
                </a>

              </div>

            ) : (

              <div className="property-container">

                {wishlist.map((item) => {

                  const property =
                    item.property;

                  if (!property) {
                    return null;
                  }

                  return (

                    <article
                      className="property-card"
                      key={item._id}
                    >

                      <div className="property-image-wrapper">

                        {property.image ? (

                          <img
                            src={
                              property.image.startsWith(
                                "http"
                              )
                                ? property.image
                                : `${SERVER_URL}${
                                    property.image.startsWith(
                                      "/"
                                    )
                                      ? ""
                                      : "/"
                                  }${property.image}`
                            }
                            alt={
                              property.title
                            }
                            className="property-image"
                          />

                        ) : (

                          <div className="no-image">
                            Property Image
                          </div>

                        )}

                        <span className="property-badge-static">
                          {
                            property.property_type
                          }
                        </span>

                      </div>

                      <div className="property-info">

                        <p className="property-location">
                          {property.location}
                        </p>

                        <h3>
                          {property.title}
                        </h3>

                        <p className="property-price">
                          ₹
                          {Number(
                            property.price
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </p>

                        <div className="buyer-property-actions">

                          <button
                            className="view-button"
                            onClick={() =>
                              handleViewDetails(
                                property
                              )
                            }
                          >
                            View Details
                          </button>

                          <button
                            className="wishlist-button active"
                            onClick={() =>
                              removeFromWishlist(
                                property._id
                              )
                            }
                          >
                            ♥ Remove
                          </button>

                        </div>

                      </div>

                    </article>

                  );
                })}

              </div>

            )}

          </div>

        </section>
      )}

      {/* =================================================
          ADMIN PROPERTY FORM
      ================================================= */}

      {user?.role === "admin" && (
        <section
          className="form-section"
          id="add-property"
        >

          <div className="form-container">

            <div className="section-heading centered">

              <span className="section-label">
                PROPERTY MANAGEMENT
              </span>

              <h2>
                {editingId
                  ? "Update Property"
                  : "Add New Property"}
              </h2>

              <p>
                Enter complete property
                information.
              </p>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-grid">

                {/* TITLE */}

                <div className="form-group full">

                  <label>
                    Property Title
                  </label>

                  <input
                    type="text"
                    name="title"
                    placeholder="Enter property title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* MAIN PROPERTY PHOTO */}

                <div className="form-group full">

                  <label>
                    Main Property Photo
                  </label>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => {
                      const file =
                        e.target.files?.[0];

                      if (file) {
                        setFormData(
                          (previous) => ({
                            ...previous,
                            image: file,
                          })
                        );
                      }
                    }}
                  />

                  {formData.image instanceof File && (
                    <small>
                      Selected image:{" "}
                      {formData.image.name}
                    </small>
                  )}

                  {typeof formData.image ===
                    "string" &&
                    formData.image && (
                      <small>
                        Existing main image selected
                      </small>
                    )}

                </div>

                {/* MORE PHOTOS */}

                <div className="form-group full">

                  <label>
                    More Property Photos
                  </label>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(
                        e.target.files || []
                      );

                      if (files.length > 0) {
                        setFormData(
                          (previous) => ({
                            ...previous,
                            images: [
                              ...previous.images.filter(
                                (image) =>
                                  typeof image ===
                                  "string"
                              ),
                              ...files,
                            ],
                          })
                        );
                      }
                    }}
                  />

                  {formData.images.length >
                    0 && (
                    <small>
                      {formData.images.length}{" "}
                      photo(s) available
                    </small>
                  )}

                </div>

                {/* VIDEO */}

                <div className="form-group full">

                  <label>
                    Property Video
                  </label>

                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={(e) => {
                      const file =
                        e.target.files?.[0];

                      if (file) {
                        setFormData(
                          (previous) => ({
                            ...previous,
                            video: file,
                          })
                        );
                      }
                    }}
                  />

                  {formData.video instanceof File && (
                    <small>
                      Selected video:{" "}
                      {formData.video.name}
                    </small>
                  )}

                  {typeof formData.video ===
                    "string" &&
                    formData.video && (
                      <small>
                        Existing video selected
                      </small>
                    )}

                </div>

                {/* GOOGLE MAP */}

                <div className="form-group full">

                  <label>
                    Google Maps Location
                  </label>

                  <input
                    type="text"
                    name="map_location"
                    placeholder="Paste Google Maps URL"
                    value={
                      formData.map_location
                    }
                    onChange={handleChange}
                  />

                  {/* SHOW EXTRACTED COORDINATES */}

                  {formData.latitude !== "" &&
                    formData.longitude !== "" && (
                      <small>
                        Location detected:{" "}
                        {formData.latitude},{" "}
                        {formData.longitude}
                      </small>
                    )}

                  {formData.map_location &&
                    formData.latitude === "" &&
                    formData.longitude === "" && (
                      <small>
                        Please paste a Google Maps
                        URL containing the location
                        coordinates.
                      </small>
                    )}

                </div>

                {/* PROPERTY TYPE */}

                <div className="form-group">

                  <label>
                    Property Type
                  </label>

                  <select
                    name="property_type"
                    value={
                      formData.property_type
                    }
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

                <div className="form-group">

                  <label>
                    Location
                  </label>

                  <input
                    type="text"
                    name="location"
                    placeholder="Property location"
                    value={
                      formData.location
                    }
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* PRICE */}

                <div className="form-group">

                  <label>
                    Price
                  </label>

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

                <div className="form-group">

                  <label>
                    Bedrooms
                  </label>

                  <input
                    type="number"
                    name="bedrooms"
                    value={
                      formData.bedrooms
                    }
                    onChange={handleChange}
                    min="0"
                    required
                  />

                </div>

                {/* BATHROOMS */}

                <div className="form-group">

                  <label>
                    Bathrooms
                  </label>

                  <input
                    type="number"
                    name="bathrooms"
                    value={
                      formData.bathrooms
                    }
                    onChange={handleChange}
                    min="0"
                    required
                  />

                </div>

                {/* AREA */}

                <div className="form-group">

                  <label>
                    Area
                  </label>

                  <input
                    type="number"
                    name="area_sqft"
                    placeholder="Area in sq.ft"
                    value={
                      formData.area_sqft
                    }
                    onChange={handleChange}
                    min="0"
                  />

                </div>

                {/* DESCRIPTION */}

                <div className="form-group full">

                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    placeholder="Write property description"
                    value={
                      formData.description
                    }
                    onChange={handleChange}
                    rows="5"
                  />

                </div>

              </div>

              {/* FORM BUTTONS */}

              <div className="form-actions">

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingId
                    ? "Update Property"
                    : "Publish Property"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}

              </div>

            </form>

          </div>

        </section>
      )}

      {/* =================================================
          PROJECTS
      ================================================= */}

      <section
        className="projects-section"
        id="projects"
      >

        <div className="section-container">

          <div className="section-heading centered">

            <span className="section-label">
              OUR PROJECTS
            </span>

            <h2>
              Construction Projects
            </h2>

            <p>
              Discover our ongoing and
              completed construction
              projects.
            </p>

          </div>

          <div className="project-grid">

            <article className="project-card">

              <div className="project-image project-one">
                <span>
                  ONGOING PROJECT
                </span>
              </div>

              <div className="project-content">

                <h3>
                  Residential Development
                </h3>

                <p>
                  Modern residential spaces
                  designed with quality
                  construction.
                </p>

                <a href="/contact">
                  Enquire About Project
                </a>

              </div>

            </article>

            <article className="project-card">

              <div className="project-image project-two">
                <span>
                  COMPLETED PROJECT
                </span>
              </div>

              <div className="project-content">

                <h3>
                  Premium Housing Project
                </h3>

                <p>
                  Carefully planned homes
                  combining practical layouts
                  with modern architecture.
                </p>

                <a href="/contact">
                  View Project Information
                </a>

              </div>

            </article>

            <article className="project-card">

              <div className="project-image project-three">
                <span>
                  UPCOMING PROJECT
                </span>
              </div>

              <div className="project-content">

                <h3>
                  Future Development
                </h3>

                <p>
                  New residential and
                  commercial opportunities
                  are being planned.
                </p>

                <a href="/contact">
                  Request Information
                </a>

              </div>

            </article>

          </div>

        </div>

      </section>

      {/* =================================================
          SERVICES
      ================================================= */}

      <section
        className="services-section"
        id="services"
      >

        <div className="section-container">

          <div className="section-heading centered">

            <span className="section-label">
              WHAT WE DO
            </span>

            <h2>
              Our Services
            </h2>

            <p>
              Professional property and
              construction services.
            </p>

          </div>

          <div className="services-grid">

            <div className="service-card">

              <div className="service-number">
                01
              </div>

              <h3>
                Property Development
              </h3>

              <p>
                Development of thoughtfully
                planned properties.
              </p>

            </div>

            <div className="service-card">

              <div className="service-number">
                02
              </div>

              <h3>
                Property Sales
              </h3>

              <p>
                Find properties based on
                location and budget.
              </p>

            </div>

            <div className="service-card">

              <div className="service-number">
                03
              </div>

              <h3>
                Construction Services
              </h3>

              <p>
                Quality construction solutions
                focused on durability.
              </p>

            </div>

            <div className="service-card">

              <div className="service-number">
                04
              </div>

              <h3>
                Customer Support
              </h3>

              <p>
                Customer assistance with
                property enquiries.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          ABOUT
      ================================================= */}

      <section
        className="about-section"
        id="about"
      >

        <div className="about-container">

          <div className="about-image"></div>

          <div className="about-content">

            <span className="section-label">
              ABOUT HOMEFINDER
            </span>

            <h2>
              Building Better Spaces
              for Better Living
            </h2>

            <p>
              HomeFinder is a professional
              property platform designed to
              make property discovery simple,
              transparent and convenient.
            </p>

            <p>
              From residential properties
              to construction projects,
              customers can find useful
              property information before
              making an enquiry.
            </p>

            <div className="about-points">

              <div>

                <strong>
                  Quality
                </strong>

                <span>
                  Carefully presented properties
                </span>

              </div>

              <div>

                <strong>
                  Transparency
                </strong>

                <span>
                  Clear property information
                </span>

              </div>

              <div>

                <strong>
                  Support
                </strong>

                <span>
                  Customer-focused assistance
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default App;