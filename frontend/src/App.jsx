import { useEffect, useState } from "react";
import "./App.css";
import Auth from "./Auth";
import Contact from "./Contact";

const API_URL = "http://localhost:5000/api";

function App() {
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
  const [selectedProperty, setSelectedProperty] = useState(null);

  // =====================================================
  // WISHLIST
  // =====================================================

  const [wishlist, setWishlist] = useState([]);
// =====================================================
// INQUIRY
// =====================================================

const [showInquiryForm, setShowInquiryForm] =
  useState(false);

const [inquiryProperty, setInquiryProperty] =
  useState(null);

const [inquiryData, setInquiryData] =
  useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    message: "",
  });

const [inquiryLoading, setInquiryLoading] =
  useState(false);
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
    image: "",
  };

  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

<<<<<<< HEAD
  // =====================================================
  // FETCH PROPERTIES
  // =====================================================
const fetchProperties = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("No authentication token found.");
      return;
    }

    const response = await fetch(`${API_URL}/properties`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    console.log("Properties API response:", data);

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      handleLogout();
      return;
    }

    if (!response.ok) {
      console.error("Properties error:", data);
      return;
    }

    let propertyData = Array.isArray(data)
      ? data
      : data.properties || [];

    // Buyers should see only Available properties
    if (user?.role === "buyer") {
      propertyData = propertyData.filter(
        (property) => property.status === "Available"
      );
    }

    setProperties(propertyData);
  } catch (error) {
    console.error("Failed to fetch properties:", error);
=======

const fetchProperties = async () => {
  try {

    console.log("Fetching properties...");

    const response = await fetch(
      "http://localhost:5000/api/properties"
    );

    console.log(
      "Response status:",
      response.status
    );

    const data = await response.json();

    console.log(
      "Properties received:",
      data
    );


    if (!response.ok) {
      console.error(
        "Properties API error:",
        data
      );
      return;
    }


    if (!Array.isArray(data)) {
      console.error(
        "Expected array but received:",
        data
      );

      setProperties([]);
      return;
    }


    // ---------------------------------------------
    // TEMPORARILY SHOW ALL PROPERTIES
    // ---------------------------------------------

    setProperties(data);

  } catch (error) {

    console.error(
      "FETCH PROPERTIES ERROR:",
      error
    );
>>>>>>> origin/master
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
<<<<<<< HEAD

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchProperties();

    if (user.role === "buyer") {
      fetchWishlist();
    }
  }, [user]);

=======
// =====================================================
// LOAD DATA
// =====================================================

useEffect(() => {
  fetchProperties();

  if (user?.role === "buyer") {
    fetchWishlist();
  }
}, [user]);
>>>>>>> origin/master
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

      alert("Property added to wishlist ❤️");
    } catch (error) {
      console.error(error);
      alert("Unable to add property to wishlist.");
    }
  };

  // =====================================================
  // REMOVE WISHLIST
  // =====================================================

  const removeFromWishlist = async (propertyId) => {
    try {
      const token = localStorage.getItem("token");

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
    return wishlist.some(
      (item) => item.property?._id === propertyId
    );
  };

  // =====================================================
  // UPDATE PROPERTY STATUS
  // ADMIN ONLY
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

      if (
        selectedProperty &&
        selectedProperty._id === propertyId
      ) {
        setSelectedProperty(data.property);
      }

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
    setProperties([]);
    setWishlist([]);
    setSelectedProperty(null);
    setEditingId(null);
    setFormData(emptyForm);
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
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
      let imageUrl = "";

      // =================================================
      // IMAGE UPLOAD
      // =================================================

      if (formData.image instanceof File) {
        const imageFormData = new FormData();

        imageFormData.append(
          "image",
          formData.image
        );

        const uploadResponse = await fetch(
          `${API_URL.replace("/api", "")}/api/upload`,
          {
            method: "POST",
            body: imageFormData,
          }
        );

        const uploadData =
          await uploadResponse.json();

        if (!uploadResponse.ok) {
          alert(
            uploadData.message ||
              "Image upload failed."
          );
          return;
        }

        imageUrl = uploadData.image;
      } else if (
        typeof formData.image === "string"
      ) {
        imageUrl = formData.image;
      }

      // =================================================
      // PROPERTY DATA
      // =================================================

      const propertyData = {
        title: formData.title.trim(),
        property_type: formData.property_type,
        location: formData.location.trim(),
        price: Number(formData.price),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        area_sqft: Number(formData.area_sqft || 0),
        description:
          formData.description.trim(),
        image: imageUrl,
      };

      // =================================================
      // ADD / UPDATE
      // =================================================

      const url = editingId
        ? `${API_URL}/properties/${editingId}`
        : `${API_URL}/properties`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(propertyData),
      });

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
            "Property operation failed."
        );
        return;
      }

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
      console.error(error);
      alert("Backend connection failed.");
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
      description: property.description || "",
      image: property.image || "",
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

      if (selectedProperty?._id === id) {
        setSelectedProperty(null);
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

      const matchesSearch =
        searchText === "" ||
        title.includes(searchText) ||
        location.includes(searchText);

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
    setSelectedProperty(property);

    setTimeout(() => {
      document
        .getElementById("property-details")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  };

  // =====================================================
  // CONTACT
  // =====================================================

  const handleContact = () => {
    setSelectedProperty(null);

    setTimeout(() => {
      document
        .getElementById("contact")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  };
// =====================================================
// INQUIRY FORM CHANGE
// =====================================================

const handleInquiryChange = (e) => {
  const { name, value } = e.target;

  setInquiryData((previous) => ({
    ...previous,
    [name]: value,
  }));
};

// =====================================================
// OPEN INQUIRY FORM
// =====================================================

const openInquiryForm = (property) => {
  setInquiryProperty(property);

  setInquiryData({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    message: "",
  });

  setShowInquiryForm(true);

  setTimeout(() => {
    document
      .getElementById("inquiry-form")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }, 100);
};

// =====================================================
// SUBMIT INQUIRY
// =====================================================

const handleInquirySubmit = async (e) => {
  e.preventDefault();

  try {
    setInquiryLoading(true);

    const token =
      localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      return;
    }

    if (!inquiryProperty) {
      alert("Property not selected.");
      return;
    }

    const response = await fetch(
      `${API_URL}/inquiries`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({
          propertyId:
            inquiryProperty._id,

          name:
            inquiryData.name,

          email:
            inquiryData.email,

          phone:
            inquiryData.phone,

          message:
            inquiryData.message,
        }),
      }
    );

    const data =
      await response.json();

    if (response.status === 401) {
      alert("Session expired.");
      handleLogout();
      return;
    }

    if (!response.ok) {
      alert(
        data.message ||
        "Failed to submit inquiry."
      );
      return;
    }

    alert(
      "Your inquiry has been submitted successfully! 🎉"
    );

    setShowInquiryForm(false);
    setInquiryProperty(null);

    setInquiryData({
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      message: "",
    });
  } catch (error) {
    console.error(
      "Inquiry submission error:",
      error
    );

    alert(
      "Unable to connect to backend."
    );
  } finally {
    setInquiryLoading(false);
  }
};
  // =====================================================
  // LOGIN PAGE
  // =====================================================

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  // =====================================================
  // MAIN WEBSITE
  // =====================================================

  return (
    <div className="app">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <header className="navbar">

        <a href="#home" className="logo">
          <span className="logo-mark">SK</span>

          <span>
            SK
            <span className="logo-accent">
              Constructions
            </span>
          </span>
        </a>

        <nav className="nav-links">

          <a href="#home">Home</a>

          <a href="#properties">
            Properties
          </a>

          <a href="#projects">
            Projects
          </a>

          <a href="#services">
            Services
          </a>

          <a href="#about">
            About Us
          </a>

          <a href="#contact">
            Contact
          </a>

          {user.role === "buyer" && (
            <a href="#wishlist">
              Wishlist ❤️
            </a>
          )}

          {user.role === "admin" && (
            <a href="#add-property">
              Add Property
            </a>
          )}

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </nav>

      </header>

      {/* =================================================
          ADMIN DASHBOARD
      ================================================= */}

      {user.role === "admin" && (

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
                Manage properties and maintain
                the HomeFinder platform.
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
                <span>Houses</span>
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
                <span>Villas</span>
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
                <span>Plots</span>
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
                <span>Available</span>
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
                <span>Sold</span>
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
            Explore carefully selected homes,
            villas, apartments and plots in
            desirable locations.
          </p>

          <div className="hero-buttons">

            <a
              href="#properties"
              className="hero-button"
            >
              Explore Properties
            </a>

            <a
              href="#contact"
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
                  setPropertyType(
                    e.target.value
                  )
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

            {user.role === "admin" && (

              <div className="search-field">

                <label>
                  Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
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
                          src={property.image}
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

                      {/* PROPERTY TYPE */}

                      <span className="property-badge-static">
                        {property.property_type}
                      </span>

                      {/* STATUS */}

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

                    {/* PROPERTY INFO */}

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
                          {property.bedrooms ||
                            0}{" "}
                          Bedrooms
                        </span>

                        <span>
                          {property.bathrooms ||
                            0}{" "}
                          Bathrooms
                        </span>

                        <span>
                          {property.area_sqft ||
                            0}{" "}
                          sq.ft
                        </span>

                      </div>

                      {property.description && (

                        <p className="property-description">
                          {property.description}
                        </p>

                      )}

                      {/* ADMIN */}

                      {user.role === "admin" && (

                        <div className="property-actions">

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

                      {/* BUYER */}

                      {user.role === "buyer" && (

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
          PROPERTY DETAILS
      ================================================= */}

      {selectedProperty && (

        <section
          className="property-details-section"
          id="property-details"
        >

          <div className="property-details-container">

            <button
              className="close-details-button"
              onClick={() =>
                setSelectedProperty(null)
              }
            >
              Close
            </button>

            <div className="details-image-container">

              {selectedProperty.image ? (

                <img
                  src={selectedProperty.image}
                  alt={selectedProperty.title}
                  className="details-property-image"
                />

              ) : (

                <div className="details-no-image">
                  Property Image
                </div>

              )}

            </div>

            <div className="details-content">

              <span className="property-badge-static">
                {
                  selectedProperty.property_type
                }
              </span>

              <h1>
                {selectedProperty.title}
              </h1>

              <p className="details-location">
                {selectedProperty.location}
              </p>

              <p className="details-price">
                ₹
                {Number(
                  selectedProperty.price
                ).toLocaleString("en-IN")}
              </p>

              <h2>
                Property Information
              </h2>

              <div className="features-grid">

                <div className="feature-card">
                  <strong>
                    {selectedProperty.bedrooms ||
                      0}
                  </strong>
                  <p>Bedrooms</p>
                </div>

                <div className="feature-card">
                  <strong>
                    {selectedProperty.bathrooms ||
                      0}
                  </strong>
                  <p>Bathrooms</p>
                </div>

                <div className="feature-card">
                  <strong>
                    {selectedProperty.area_sqft ||
                      0}
                  </strong>
                  <p>Square Feet</p>
                </div>

                <div className="feature-card">
                  <strong>
                    {
                      selectedProperty.property_type
                    }
                  </strong>
                  <p>Property Type</p>
                </div>

              </div>

              <h2>
                Property Description
              </h2>

              <p className="details-description">
                {selectedProperty.description ||
                  "Detailed property information is currently unavailable."}
              </p>

              {user.role === "buyer" && (

                <div className="contact-owner">

                  <h2>
                    Interested in This Property?
                  </h2>

                  <p>
                    Contact our team for
                    additional information,
                    property visits and
                    enquiries.
                  </p>
<button
  className="contact-owner-button"
  onClick={() =>
    openInquiryForm(selectedProperty)
  }
>
  Send an Enquiry
</button>
                </div>

              )}

            </div>

          </div>

        </section>

      )}
{/* =====================================================
    INQUIRY FORM
===================================================== */}

{showInquiryForm &&
  inquiryProperty && (
    <section
      className="inquiry-section"
      id="inquiry-form"
    >
      <div className="inquiry-container">

        <div className="section-heading centered">

          <span className="section-label">
            PROPERTY ENQUIRY
          </span>

          <h2>
            Enquire About This Property
          </h2>

          <p>
            Send your enquiry and our team
            will contact you.
          </p>

        </div>

        <div className="inquiry-property">

          <h3>
            {inquiryProperty.title}
          </h3>

          <p>
            {inquiryProperty.location}
          </p>

          <strong>
            ₹
            {Number(
              inquiryProperty.price
            ).toLocaleString("en-IN")}
          </strong>

        </div>

        <form
          className="inquiry-form"
          onSubmit={handleInquirySubmit}
        >

          <div className="inquiry-grid">

            <div className="form-group">

              <label>
                Name
              </label>

              <input
                type="text"
                name="name"
                value={inquiryData.name}
                onChange={handleInquiryChange}
                required
              />

            </div>

            <div className="form-group">

              <label>
                Email
              </label>

              <input
                type="email"
                name="email"
                value={inquiryData.email}
                onChange={handleInquiryChange}
                required
              />

            </div>

            <div className="form-group">

              <label>
                Phone
              </label>

              <input
                type="tel"
                name="phone"
                placeholder="Enter phone number"
                value={inquiryData.phone}
                onChange={handleInquiryChange}
                required
              />

            </div>

            <div className="form-group full">

              <label>
                Message
              </label>

              <textarea
                name="message"
                rows="5"
                placeholder="I am interested in this property..."
                value={inquiryData.message}
                onChange={handleInquiryChange}
                required
              />

            </div>

          </div>

          <div className="form-actions">

            <button
              type="submit"
              className="primary-button"
              disabled={inquiryLoading}
            >
              {inquiryLoading
                ? "Sending..."
                : "Send Inquiry"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setShowInquiryForm(false);
                setInquiryProperty(null);
              }}
            >
              Cancel
            </button>

          </div>

        </form>

      </div>
    </section>
  )}
      {/* =================================================
          WISHLIST
      ================================================= */}

      {user.role === "buyer" && (

        <section
          className="wishlist-section"
          id="wishlist"
        >

          <div className="section-container">

            <div className="section-heading">

              <div>

                <span className="section-label">
                  MY FAVORITES
                </span>

                <h2>
                  My Wishlist ❤️
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
                            src={property.image}
                            alt={property.title}
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

      {user.role === "admin" && (

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

                <div className="form-group full">

                  <label>
                    Property Photo
                  </label>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => {

                      const file =
                        e.target.files[0];

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

                </div>

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

                <div className="form-group">

                  <label>
                    Location
                  </label>

                  <input
                    type="text"
                    name="location"
                    placeholder="Property location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />

                </div>

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

                <div className="form-group">

                  <label>
                    Bedrooms
                  </label>

                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    min="0"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Bathrooms
                  </label>

                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    min="0"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Area
                  </label>

                  <input
                    type="number"
                    name="area_sqft"
                    placeholder="Area in sq.ft"
                    value={formData.area_sqft}
                    onChange={handleChange}
                    min="0"
                  />

                </div>

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
              completed construction projects.
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

                <a href="#contact">
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

                <a href="#contact">
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

                <a href="#contact">
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
              From residential properties to
              construction projects, customers
              can find useful property
              information before making an
              enquiry.
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

      {/* =================================================
          CONTACT
      ================================================= */}

      <section id="contact">
        <Contact />
      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer>

        <div className="footer-container">

          <div className="footer-brand">

            <h2>
              Home<span>Finder</span>
            </h2>

            <p>
              A simple and professional
              platform for discovering
              properties and construction
              projects.
            </p>

          </div>

          <div className="footer-links">

            <h3>
              Quick Links
            </h3>

            <a href="#home">
              Home
            </a>

            <a href="#properties">
              Properties
            </a>

            <a href="#projects">
              Projects
            </a>

            <a href="#services">
              Services
            </a>

            <a href="#about">
              About Us
            </a>

            <a href="#contact">
              Contact
            </a>

          </div>

          <div className="footer-contact">

            <h3>
              Contact
            </h3>

            <p>
              Kopargaon, Maharashtra, India
            </p>

            <p>
              +91 98765 43210
            </p>

            <p>
              homefinder@gmail.com
            </p>

          </div>

        </div>

        <div className="footer-bottom">

          <p>
            © 2026 HomeFinder.
            All rights reserved.
          </p>

        </div>

      </footer>

    </div>
  );
}

export default App;