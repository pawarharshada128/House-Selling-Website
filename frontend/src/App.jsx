
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLocale } from "./LocaleContext";
import { API_URL, SERVER_URL } from "./apiConfig";
import ReviewsSection from "./ReviewsSection";
import "./App.css";

function App() {
  return <HomePage />;
}

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLocale();

  const [buildRequestLoading, setBuildRequestLoading] = useState(false);
  const [buildRequestFeedback, setBuildRequestFeedback] = useState(null);
  const buildRequestPending = useRef(false);

  useEffect(() => {
    const sectionId = location.state?.scrollTo;
    if (!sectionId) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.pathname, location.state, navigate]);

  const handleBuildRequest = async (event) => {
    event.preventDefault();

    if (buildRequestPending.current) return;

    const token = localStorage.getItem("token");
    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      console.error("Unable to read saved user:", error);
    }

    if (!token || currentUser?.role !== "buyer") {
      if (currentUser?.role === "admin") {
        setBuildRequestFeedback({
          type: "error",
          text: t("Sign in with a customer account to submit an enquiry."),
        });
        return;
      }

      navigate("/login", {
        state: {
          returnTo: "/",
          returnState: { scrollTo: "build-on-your-land" },
        },
      });
      return;
    }

    buildRequestPending.current = true;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const requestDetails = [
      "Build on Your Land request",
      `Land location: ${formData.get("landLocation")}`,
      `Land area: ${formData.get("landArea") || "Not provided"} sq. ft.`,
      `Estimated budget: ${formData.get("budget") || "Not provided"}`,
      `Preferred house type: ${formData.get("homeType") || "Not specified"}`,
      `Preferred home size: ${formData.get("homeSize") || "Not specified"}`,
      `Number of floors: ${formData.get("floors") || "Not specified"}`,
      `Bedrooms: ${formData.get("bedrooms") || "Not specified"}`,
      `Preferred design: ${formData.get("preferredDesign") || "Not specified"}`,
      `Additional details: ${formData.get("requirements") || "None provided"}`,
    ].join("\n");

    setBuildRequestLoading(true);
    setBuildRequestFeedback(null);

    try {
      const response = await fetch(`${API_URL}/enquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          message: requestDetails,
          propertyTitle: "Build on Your Land",
          requestType: "BuildRequest",
          buildDetails: {
            landLocation: String(formData.get("landLocation") || ""),
            plotArea: String(formData.get("landArea") || ""),
            homeType: String(formData.get("homeType") || ""),
            homeSize: String(formData.get("homeSize") || ""),
            floors: String(formData.get("floors") || ""),
            bedrooms: String(formData.get("bedrooms") || ""),
            budget: String(formData.get("budget") || ""),
            preferredDesign: String(formData.get("preferredDesign") || ""),
            additionalRequirements: String(formData.get("requirements") || ""),
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || "We couldn't send your request."
        );
      }

      setBuildRequestFeedback({
        type: "success",
        text: `${t("Thanks! Our construction team will contact you to discuss your land and plans.")} ${t("Reference ID")}: ${data.referenceId || data.enquiry?._id}`,
      });
      form.reset();
    } catch (error) {
      console.error("Build request error:", error);
      setBuildRequestFeedback({
        type: "error",
        text: error.message || "Unable to send your request. Please try again.",
      });
    } finally {
      buildRequestPending.current = false;
      setBuildRequestLoading(false);
    }
  };

  // Keep all your existing HomePage code below.

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
        alert(t("Please login first."));
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
        alert(data.message || t("Failed to add property."));
        return;
      }

      await fetchWishlist();

      alert(t("Property added to Favorites ❤️"));
    } catch (error) {
      console.error(error);
      alert(t("Unable to add property to Favorites."));
    }
  };

  // =====================================================
  // REMOVE WISHLIST
  // =====================================================

  const removeFromWishlist = async (propertyId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert(t("Please login first."));
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
        alert(data.message || t("Failed to remove property."));
        return;
      }

      await fetchWishlist();

      alert(t("Property removed from wishlist."));
    } catch (error) {
      console.error(error);
      alert(t("Unable to remove property."));
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
            {t("FIND A PLACE TO CALL HOME")}
          </span>

          <h1>
            {t("Discover a Home")}
            <br />
            {t("Designed for Your Life")}
          </h1>

          <p>
            {t("Explore carefully selected homes, villas, apartments and plots in desirable locations.")}
          </p>

          <div className="hero-buttons">

            <a
              href="#properties"
              className="hero-button"
            >
              {t("Explore Properties")}
            </a>

            <a
              href="#build-on-your-land"
              className="hero-outline-button"
            >
              {t("Build on Your Land")}
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
              {t("WELCOME TO HOMEFINDER")}
            </span>

            <h2>
              {t("A Better Way to Find Your Next Property")}
            </h2>

          </div>

          <div className="intro-description">

            <p>
              {t("HomeFinder brings properties, projects and professional construction services together in one convenient platform.")}
            </p>

            <a
              href="#about"
              className="text-link"
            >
              {t("Learn More About Us")}
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
                {t("OUR PROPERTIES")}
              </span>

              <h2>
                {t("Featured Properties")}
              </h2>

            </div>

            <p>
              {t("Explore our available residential and commercial properties.")}
            </p>

          </div>

          {/* SEARCH */}

          <div className="search-panel">

            <div className="search-field">

              <label>
                {t("Search")}
              </label>

              <input
                type="text"
                placeholder={t("Search title or location")}
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

            <div className="search-field">

              <label>
                {t("Property Type")}
              </label>

              <select
                value={propertyType}
                onChange={(e) =>
                  setPropertyType(e.target.value)
                }
              >

                <option value="All">
                  {t("All Types")}
                </option>

                <option value="House">
                  {t("House")}
                </option>

                <option value="Penthouse">
                  {t("Penthouse")}
                </option>

                <option value="Villa">
                  {t("Villa")}
                </option>

                <option value="Plot">
                  {t("Plot")}
                </option>

                <option value="Commercial">
                  {t("Commercial")}
                </option>

              </select>

            </div>

            <div className="search-field">

              <label>
                {t("Maximum Price")}
              </label>

              <input
                type="number"
                placeholder={t("Maximum price")}
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
              {t("Clear Filters")}
            </button>

          </div>

          <p className="property-count">
            {t("Showing")}{" "}
            <strong>
              {filteredProperties.length}
            </strong>{" "}
            {t("properties")}
          </p>

          {/* PROPERTY GRID */}

          <div className="property-container">

            {filteredProperties.length === 0 ? (

              <div className="no-properties">

                <h3>
                  {t("No Properties Found")}
                </h3>

                <p>
                  {t("Try changing your search or filter criteria.")}
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
                      {t("Property Image")}
                    </div>

                    <span className="property-badge-static">
                      {t(property.property_type)}
                    </span>

                    <span
                      className={`property-status ${
                        (
                          property.status ||
                          "Pending"
                        ).toLowerCase()
                      }`}
                    >
                      {t(property.status || "Pending")}
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
                        {t("Bedrooms")}
                      </span>

                      <span>
                        {property.bathrooms || 0}{" "}
                        {t("Bathrooms")}
                      </span>

                      <span>
                        {property.area_sqft || 0}{" "}
                        {t("sq.ft")}
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
                          {t("View Details")}
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
                            ? `♥ ${t("Saved")}`
                            : `♡ ${t("Wishlist")}`}
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
                          {t("View Details")}
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
                  {t("My Favorites")}
                </h2>

              </div>

              <p>
                {t("Properties you have saved for later.")}
              </p>

            </div>

            {wishlist.length === 0 ? (

              <div className="no-properties">

                <h3>
                  {t("Your wishlist is empty")}
                </h3>

                <p>
                  {t("Save properties you like and find them here later.")}
                </p>

                <a
                  href="#properties"
                  className="view-button"
                >
                  {t("Explore Properties")}
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
                            {t("Property Image")}
                          </div>

                        )}

                        <span className="property-badge-static">
                          {t(property.property_type)}
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
                            {t("View Details")}
                          </button>

                          <button
                            className="wishlist-button active"
                            onClick={() =>
                              removeFromWishlist(
                                property._id
                              )
                            }
                          >
                            ♥ {t("Remove")}
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
              {t("OUR PROJECTS")}
            </span>

            <h2>
              {t("Construction Projects")}
            </h2>

            <p>
              {t("Discover our ongoing and completed construction projects.")}
            </p>

          </div>

          <div className="project-grid">

            <article className="project-card">

              <div className="project-image project-one">

                <span>
                  {t("ONGOING PROJECT")}
                </span>

              </div>

              <div className="project-content">

                <h3>
                  {t("Residential Development")}
                </h3>

                <p>
                  {t("Modern residential spaces designed with quality construction.")}
                </p>

                <a href="/contact">
                  {t("Enquire About Project")}
                </a>

              </div>

            </article>

            <article className="project-card">

              <div className="project-image project-two">

                <span>
                  {t("COMPLETED PROJECT")}
                </span>

              </div>

              <div className="project-content">

                <h3>
                  {t("Premium Housing Project")}
                </h3>

                <p>
                  {t("Carefully planned homes combining practical layouts with modern architecture.")}
                </p>

                <a href="/contact">
                  {t("View Project Information")}
                </a>

              </div>

            </article>

            <article className="project-card">

              <div className="project-image project-three">

                <span>
                  {t("UPCOMING PROJECT")}
                </span>

              </div>

              <div className="project-content">

                <h3>
                  {t("Future Development")}
                </h3>

                <p>
                  {t("New residential and commercial opportunities are being planned.")}
                </p>

                <a href="/contact">
                  {t("Request Information")}
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
              {t("WHAT WE DO")}
            </span>

            <h2>
              {t("Our Services")}
            </h2>

            <p>
              {t("Professional property and construction services.")}
            </p>

          </div>

          <div className="services-grid">

            <div className="service-card">

              <div className="service-number">
                01
              </div>

              <h3>
                {t("Property Development")}
              </h3>

              <p>
                {t("Development of thoughtfully planned properties.")}
              </p>

            </div>

            <div className="service-card">

              <div className="service-number">
                02
              </div>

              <h3>
                {t("Property Sales")}
              </h3>

              <p>
                {t("Find properties based on location and budget.")}
              </p>

            </div>

            <div className="service-card">

              <div className="service-number">
                03
              </div>

              <h3>
                {t("Construction Services")}
              </h3>

              <p>
                {t("Quality construction solutions focused on durability.")}
              </p>

            </div>

            <div className="service-card">

              <div className="service-number">
                04
              </div>

              <h3>
                {t("Customer Support")}
              </h3>

              <p>
                {t("Customer assistance with property enquiries.")}
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          BUILD ON YOUR LAND
      ================================================= */}

      <section
        className="build-land-section"
        id="build-on-your-land"
      >
        <div className="build-land-container">
          <div className="build-land-intro">
            <span className="section-label">
              {t("YOUR LAND, YOUR HOME")}
            </span>
            <h2>
              {t("Build a home that feels like yours")}
            </h2>
            <p>
              {t("Already own a plot? Tell us a little about your land and the home you have in mind. Our construction team will get in touch to discuss the next steps.")}
            </p>

            <div className="build-land-steps">
              <div>
                <span>01</span>
                <p>{t("Share your land and home requirements")}</p>
              </div>
              <div>
                <span>02</span>
                <p>{t("Discuss design, scope and budget with our team")}</p>
              </div>
              <div>
                <span>03</span>
                <p>{t("Plan your next steps together")}</p>
              </div>
            </div>
          </div>

          <form
            className="build-land-form"
            onSubmit={handleBuildRequest}
          >
            <h3>{t("Tell us about your project")}</h3>
            <p>{t("Required fields are marked with an asterisk.")}</p>

            <div className="build-land-form-grid">
              <label>
                {t("Your name *")}
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder={t("e.g. Priya Sharma")}
                  required
                  maxLength={100}
                />
              </label>

              <label>
                {t("Phone number *")}
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder={t("Your contact number")}
                  required
                  maxLength={30}
                />
              </label>

              <label className="build-land-form-full">
                {t("Email address *")}
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("you@example.com")}
                  required
                  maxLength={254}
                />
              </label>

              <label className="build-land-form-full">
                {t("Where is your land? *")}
                <input
                  name="landLocation"
                  type="text"
                  placeholder={t("City, area or full address")}
                  required
                  maxLength={200}
                />
              </label>

              <label>
                {t("Land area (sq. ft.)")}
                <input
                  name="landArea"
                  type="number"
                  min="1"
                  placeholder={t("e.g. 1200")}
                />
              </label>

              <label>
                {t("Estimated budget")}
                <select name="budget" defaultValue="">
                  <option value="">{t("Choose a range")}</option>
                  <option value="Under ₹25 lakh">{t("Under ₹25 lakh")}</option>
                  <option value="₹25–50 lakh">{t("₹25–50 lakh")}</option>
                  <option value="₹50 lakh–₹1 crore">{t("₹50 lakh–₹1 crore")}</option>
                  <option value="Above ₹1 crore">{t("Above ₹1 crore")}</option>
                  <option value="Need guidance">{t("I need guidance")}</option>
                </select>
              </label>

              <label>
                {t("Preferred house type")}
                <select name="homeType" defaultValue="">
                  <option value="">{t("Select house type")}</option>
                  <option value="Independent House">{t("Independent House")}</option>
                  <option value="Villa">{t("Villa")}</option>
                  <option value="Duplex">{t("Duplex")}</option>
                  <option value="Apartment">{t("Apartment")}</option>
                  <option value="Other">{t("Other")}</option>
                </select>
              </label>

              <label>
                {t("Preferred home size")}
                <select name="homeSize" defaultValue="">
                  <option value="">{t("Select home size")}</option>
                  <option value="Compact">{t("Compact")}</option>
                  <option value="Medium">{t("Medium")}</option>
                  <option value="Large">{t("Large")}</option>
                  <option value="Not sure yet">{t("Not sure yet")}</option>
                </select>
              </label>

              <label>
                {t("Number of floors")}
                <select name="floors" defaultValue="">
                  <option value="">{t("Select number of floors")}</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4+">4+</option>
                  <option value="Not sure yet">{t("Not sure yet")}</option>
                </select>
              </label>

              <label>
                {t("Number of bedrooms")}
                <select name="bedrooms" defaultValue="">
                  <option value="">{t("Select bedrooms")}</option>
                  <option value="1">{t("1 bedroom")}</option>
                  <option value="2">{t("2 bedrooms")}</option>
                  <option value="3">{t("3 bedrooms")}</option>
                  <option value="4+">{t("4 or more bedrooms")}</option>
                  <option value="Not sure yet">{t("Not sure yet")}</option>
                </select>
              </label>

              <label className="build-land-form-full">
                {t("Preferred design")}
                <input
                  name="preferredDesign"
                  type="text"
                  placeholder={t("e.g. contemporary, traditional, or share a reference")}
                  maxLength={200}
                />
              </label>

              <label className="build-land-form-full">
                {t("Anything else we should know?")}
                <textarea
                  name="requirements"
                  rows="4"
                  placeholder={t("Your preferred style, timeline, or other requirements")}
                  maxLength={1000}
                />
              </label>
            </div>

            {buildRequestFeedback && (
              <p
                className={`build-land-feedback ${buildRequestFeedback.type}`}
                role="status"
                aria-live="polite"
              >
                {t(buildRequestFeedback.text)}
              </p>
            )}

            <button
              type="submit"
              className="build-land-submit"
              disabled={buildRequestLoading}
            >
              {buildRequestLoading
                ? t("Sending your request...")
                : t("Request a construction consultation")}
            </button>
            <small>
              {t("No commitment required. We’ll contact you to understand your project.")}
            </small>
          </form>
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
              {t("ABOUT HOMEFINDER")}
            </span>

            <h2>
              {t("Building Better Spaces for Better Living")}
            </h2>

            <p>
              {t("HomeFinder is a professional property platform designed to make property discovery simple, transparent and convenient.")}
            </p>

            <p>
              {t("From residential properties to construction projects, customers can find useful property information before making an enquiry.")}
            </p>

            <div className="about-points">

              <div>

                <strong>
                  {t("Quality")}
                </strong>

                <span>
                  {t("Carefully presented properties")}
                </span>

              </div>

              <div>

                <strong>
                  {t("Transparency")}
                </strong>

                <span>
                  {t("Clear property information")}
                </span>

              </div>

              <div>

                <strong>
                  {t("Support")}
                </strong>

                <span>
                  {t("Customer-focused assistance")}
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>

      <ReviewsSection />

    </div>
  );
}

export default App;