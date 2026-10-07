import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

// const API_URL = "http://localhost:5000/api";
// const SERVER_URL = "http://localhost:5000";
const API_URL = "https://house-selling-website.onrender.com/api/properties";
const SERVER_URL = "https://house-selling-website.onrender.com";
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
  // FILTER PROPERTIES
  // =====================================================

  const filteredProperties = properties.filter((property) => {
    const searchText = search.toLowerCase().trim();

    const title = property.title?.toLowerCase() || "";

    const location =
      property.location?.toLowerCase() || "";

    const propertyTypeText =
      property.property_type?.toLowerCase() || "";

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
      Number(property.price) <= Number(maxPrice);

    return (
      matchesSearch &&
      matchesType &&
      matchesPrice
    );
  });

  // =====================================================
  // VIEW DETAILS
  // =====================================================

  const handleViewDetails = (property) => {
    navigate(`/property/${property._id}`);
  };

  // =====================================================
  // IMAGE URL
  // =====================================================

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (image.startsWith("http")) {
      return image;
    }

    return `${SERVER_URL}${
      image.startsWith("/") ? "" : "/"
    }${image}`;
  };

  // =====================================================
  // MAIN WEBSITE
  // =====================================================

  return (
    <div className="app">

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

            <button
              className="clear-button"
              onClick={() => {
                setSearch("");
                setPropertyType("All");
                setMaxPrice("");
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

              filteredProperties.map((property) => (

                <article
                  className="property-card"
                  key={property._id}
                >

                  {/* IMAGE */}

                  <div className="property-image-wrapper">

                    {property.image ? (

                      <img
                        src={getImageUrl(property.image)}
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
                        display: property.image
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
                      ).toLocaleString("en-IN")}
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

                    {/* BUYER ACTIONS */}

                    {user?.role === "buyer" ? (

                      <div className="buyer-property-actions">

                        <button
                          className="view-button"
                          onClick={() =>
                            handleViewDetails(property)
                          }
                        >
                          View Details
                        </button>

                        <button
                          className={
                            isWishlisted(property._id)
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
                          {isWishlisted(property._id)
                            ? "♥ Saved"
                            : "♡ Wishlist"}
                        </button>

                      </div>

                    ) : (

                      <div className="public-property-actions">

                        <button
                          className="view-button"
                          onClick={() =>
                            handleViewDetails(property)
                          }
                        >
                          View Details
                        </button>

                      </div>

                    )}

                  </div>

                </article>

              ))

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
                            src={getImageUrl(
                              property.image
                            )}
                            alt={property.title}
                            className="property-image"
                          />

                        ) : (

                          <div className="no-image">
                            Property Image
                          </div>

                        )}

                        <span className="property-badge-static">
                          {property.property_type}
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
                          ).toLocaleString("en-IN")}
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