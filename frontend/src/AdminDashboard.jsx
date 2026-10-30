import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import PropertyForm from "./PropertyForm";
import AdminNavbar from "./AdminNavbar";
import CustomerRequestManagement from "./EnquiryManagement";
import BookingManagement from "./BookingManagement";
import AdminReviewManagement from "./AdminReviewManagement";
import { API_URL, SERVER_URL } from "./apiConfig";
import { isBuildLandRequest } from "./enquiryUtils";
import { useLocale } from "./LocaleContext";

import "./AdminDashboard.css";


/* =====================================================
   API
===================================================== */

const getEnquiryReplyDetails = (enquiry, t) => {
  const isBuildRequest = isBuildLandRequest(enquiry);
  const propertyTitle =
    enquiry.propertyTitle ||
    enquiry.propertyId?.title ||
    "";
  const subject = isBuildRequest
    ? t("Your Build on Your Land enquiry")
    : propertyTitle
      ? `${t("Your enquiry about")} ${propertyTitle}`
      : t("Your property enquiry");
  const topic = isBuildRequest
    ? t("your Build on Your Land request")
    : propertyTitle
      ? `${t("your enquiry about")} ${propertyTitle}`
      : t("your property enquiry");
  const message = [
    `${t("Hi")} ${enquiry.name || t("there")},`,
    "",
    `${t("Thank you for contacting Shree Krishna Constructions about")} ${topic}.`,
    t("We would be happy to discuss your requirements and answer your questions."),
    "",
    t("Please let us know a convenient time to speak."),
    "",
    t("Regards,"),
    t("Shree Krishna Constructions"),
  ].join("\n");

  return { subject, message };
};

const getWhatsAppNumber = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }

  return digits.length >= 11 ? digits : "";
};


function AdminDashboard() {

  const navigate = useNavigate();
  const { t, language } = useLocale();


  /* =====================================================
     STATE
  ===================================================== */

  const [activeMenu, setActiveMenu] =
    useState("dashboard");

  const [showPropertyModal, setShowPropertyModal] =
    useState(false);

  const [selectedProperty, setSelectedProperty] =
    useState(null);

  const [properties, setProperties] =
    useState([]);


  /* =====================================================
     STATS
  ===================================================== */

  const [stats, setStats] = useState({
    properties: 0,
    pendingProperties: 0,
    availableProperties: 0,
    soldProperties: 0,
    buyers: 0,
    inquiries: 0,
    bookings: 0,
    favorites: 0,
    revenue: 0,
  });


  /* =====================================================
     ENQUIRIES
  ===================================================== */

  const [enquiries, setEnquiries] =
    useState([]);

  const [enquiryLoading, setEnquiryLoading] =
    useState(false);

  const [enquiryError, setEnquiryError] =
    useState("");

  const [enquiryStatusFilter, setEnquiryStatusFilter] =
    useState("All");

  const [managingEnquiryId, setManagingEnquiryId] =
    useState(null);

  const [savingEnquiryId, setSavingEnquiryId] =
    useState(null);


  /* =====================================================
     PROPERTY SEARCH
  ===================================================== */

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [updatingStatusId, setUpdatingStatusId] =
    useState(null);


  /* =====================================================
     GENERAL
  ===================================================== */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [message, setMessage] =
    useState("");


  /* =====================================================
     LOGIN DATA
  ===================================================== */

  const token =
    localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    user = null;
  }

  const authRedirected = useRef(false);

  const handleUnauthorized = () => {
    if (authRedirected.current) {
      return;
    }

    authRedirected.current = true;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const authorizedFetch = async (url, options) => {
    const response = await fetch(url, options);

    if (response.status === 401) {
      handleUnauthorized();
    }

    return response;
  };


  /* =====================================================
     ADMIN CHECK + INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    if (
      !token ||
      user?.role !== "admin"
    ) {
      handleUnauthorized();
      return;
    }

    loadDashboard();
    loadProperties();
    loadEnquiries();

  }, [token, user?.role]);


  /* =====================================================
     MESSAGE
  ===================================================== */

  const showMessage = (text) => {

    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 3000);

  };


  /* =====================================================
     LOAD DASHBOARD
  ===================================================== */

  const loadDashboard = async () => {

    try {

      const response = await authorizedFetch(
        `${API_URL}/admin/dashboard`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load dashboard."
        );
      }

      const data =
        await response.json();

      setStats({
        properties:
          data.properties || 0,

        pendingProperties:
          data.pendingProperties || 0,

        availableProperties:
          data.availableProperties || 0,

        soldProperties:
          data.soldProperties || 0,

        buyers:
          data.buyers || 0,

        inquiries:
          data.inquiries || 0,

        bookings:
          data.bookings || 0,

        favorites:
          data.favorites || 0,

        revenue:
          data.revenue || 0,
      });

    } catch (error) {

      console.error(
        "Dashboard error:",
        error
      );

      setMessage(
        "Unable to load dashboard statistics."
      );

    }

  };


  /* =====================================================
     LOAD PROPERTIES
  ===================================================== */

  const loadProperties = async () => {

    try {

      setLoading(true);

      const response = await authorizedFetch(
        `${API_URL}/properties`,
        {
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load properties."
        );
      }

      const data =
        await response.json();

      const propertyList =
        Array.isArray(data)
          ? data
          : Array.isArray(data.properties)
          ? data.properties
          : Array.isArray(data.data)
          ? data.data
          : [];

      setProperties(propertyList);

    } catch (error) {

      console.error(
        "Properties error:",
        error
      );

      setMessage(
        "Unable to load properties."
      );

    } finally {

      setLoading(false);

    }

  };


  /* =====================================================
     LOAD ENQUIRIES
  ===================================================== */

  const loadEnquiries = async () => {

    try {

      setEnquiryLoading(true);
      setEnquiryError("");

      const response = await authorizedFetch(
        `${API_URL}/enquiries`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load enquiries."
        );
      }

      const data =
        await response.json();

      const enquiryList =
        Array.isArray(data)
          ? data
          : Array.isArray(data.enquiries)
          ? data.enquiries
          : Array.isArray(data.data)
          ? data.data
          : [];

      setEnquiries(enquiryList);

    } catch (error) {

      console.error(
        "Enquiries error:",
        error
      );

      setMessage(
        "Unable to load user enquiries."
      );
      setEnquiryError(
        error.message || "Unable to load customer requests."
      );

    } finally {

      setEnquiryLoading(false);

    }

  };


  /* =====================================================
     DELETE ENQUIRY
  ===================================================== */

  const handleDeleteEnquiry = async (id) => {
    const enquiry = enquiries.find((entry) => entry._id === id);
    const isBuildRequest = isBuildRequestRecord(enquiry || {});

    const confirmDelete =
      window.confirm(
        `Are you sure you want to permanently delete this ${isBuildRequest ? "build request" : "property enquiry"}?`
      );

    if (!confirmDelete) {
      return;
    }

    try {

      const response = await authorizedFetch(
        `${API_URL}/enquiries/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
            "Failed to delete enquiry."
        );

      }

      showMessage(
        "Enquiry deleted successfully."
      );

      await loadEnquiries();

    } catch (error) {

      console.error(
        "Delete enquiry error:",
        error
      );

      showMessage(
        error.message ||
          "Failed to delete enquiry."
      );

    }

  };


  /* =====================================================
     UPDATE ENQUIRY STATUS
  ===================================================== */

  const updateEnquiryStatus = async (
    id,
    status
  ) => {
    if (
      status === "Booking Confirmed" &&
      !window.confirm(
        "Confirm this booking only if the actual booking procedure has been completed."
      )
    ) {
      return;
    }

    setSavingEnquiryId(id);
    try {

      const response = await authorizedFetch(
        `${API_URL}/enquiries/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            status,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
            "Failed to update enquiry."
        );

      }

      setEnquiries(
        (previous) =>
          previous.map(
            (enquiry) =>
              enquiry._id === id
                ? {
                    ...enquiry,
                    ...(data.enquiry || {}),
                    status,
                  }
                : enquiry
          )
      );

      showMessage(
        "Enquiry status updated."
      );

    } catch (error) {

      console.error(
        "Update enquiry status error:",
        error
      );

      showMessage(
        error.message ||
          "Failed to update enquiry."
      );

    } finally {
      setSavingEnquiryId(null);
    }

  };

  const saveEnquiryManagement = async (id, updates) => {
    setSavingEnquiryId(id);
    try {
      const response = await authorizedFetch(
        `${API_URL}/enquiries/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save enquiry updates.");
      }

      setEnquiries((previous) =>
        previous.map((enquiry) =>
          enquiry._id === id ? data.enquiry : enquiry
        )
      );
      showMessage(data.message || "Enquiry updated successfully.");
      return true;
    } catch (error) {
      console.error("Save enquiry management error:", error);
      showMessage(error.message || "Failed to save enquiry updates.");
      return false;
    } finally {
      setSavingEnquiryId(null);
    }
  };

  const initiateBooking = async (enquiryId) => {
    setSavingEnquiryId(enquiryId);
    try {
      const response = await authorizedFetch(
        `${API_URL}/bookings/from-enquiry/${enquiryId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to initiate booking.");
      }
      showMessage(data.message || "Booking initiated successfully.");
      setActiveMenu("bookings");
      await Promise.all([loadEnquiries(), loadDashboard()]);
    } catch (error) {
      console.error("Initiate booking error:", error);
      showMessage(error.message || "Failed to initiate booking.");
    } finally {
      setSavingEnquiryId(null);
    }
  };


  /* =====================================================
     FILTER ENQUIRIES
  ===================================================== */

  const filteredEnquiries =
    useMemo(() => {

      return enquiries.filter((enquiry) => {
        const isBuildRequest = isBuildLandRequest(enquiry);
        const matchesSection =
          activeMenu === "build-requests"
            ? isBuildRequest
            : !isBuildRequest;
        const matchesStatus =
          enquiryStatusFilter === "All" ||
          String(enquiry.status || "New").toLowerCase() ===
            enquiryStatusFilter.toLowerCase();

        return matchesSection && matchesStatus;
      });

    }, [
      enquiries,
      enquiryStatusFilter,
      activeMenu,
    ]);

  const buildRequestCount = useMemo(
    () => enquiries.filter(isBuildLandRequest).length,
    [enquiries]
  );


  /* =====================================================
     REFRESH
  ===================================================== */

  const handleRefresh = async () => {

    try {

      setRefreshing(true);

      await Promise.all([
        loadDashboard(),
        loadProperties(),
        loadEnquiries(),
      ]);

      showMessage(
        "Dashboard refreshed successfully."
      );

    } catch (error) {

      console.error(
        "Refresh error:",
        error
      );

    } finally {

      setRefreshing(false);

    }

  };


  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });

  };


  /* =====================================================
     DELETE PROPERTY
  ===================================================== */

  const handleDelete = async (id) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this property?"
      );

    if (!confirmDelete) {
      return;
    }

    try {

      const response = await authorizedFetch(
        `${API_URL}/properties/${id}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.message ||
            "Failed to delete property."
        );

      }

      showMessage(
        "Property deleted successfully."
      );

      await loadProperties();
      await loadDashboard();

    } catch (error) {

      console.error(
        "Delete error:",
        error
      );

      showMessage(
        error.message ||
          "Failed to delete property."
      );

    }

  };


  /* =====================================================
     UPDATE PROPERTY STATUS
  ===================================================== */

  const handleStatusChange = async (
    id,
    status
  ) => {

    setUpdatingStatusId(id);

    try {

      const response = await authorizedFetch(
        `${API_URL}/properties/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update property status."
        );
      }

      setProperties((currentProperties) =>
        currentProperties.map((property) =>
          property._id === id
            ? data.property
            : property
        )
      );
      setSelectedProperty((currentProperty) =>
        currentProperty?._id === id
          ? data.property
          : currentProperty
      );

      await loadDashboard();
      showMessage(
        t(`Property status changed to ${status}.`)
      );

    } catch (error) {

      console.error(
        "Property status update error:",
        error
      );

      showMessage(
        error.message ||
          "Failed to update property status."
      );

    } finally {

      setUpdatingStatusId(null);

    }

  };


  /* =====================================================
     ADD PROPERTY
  ===================================================== */

  const openAddProperty = () => {

    setSelectedProperty(null);
    setShowPropertyModal(true);

  };


  /* =====================================================
     EDIT PROPERTY
  ===================================================== */

  const openEditProperty = (
    property
  ) => {

    setSelectedProperty(property);
    setShowPropertyModal(true);

  };


  /* =====================================================
     CLOSE PROPERTY FORM
  ===================================================== */

  const closePropertyForm = () => {

    setShowPropertyModal(false);
    setSelectedProperty(null);

  };


  /* =====================================================
     PROPERTY SUCCESS
  ===================================================== */

  const handlePropertySuccess =
    async () => {

      const wasEditing =
        Boolean(selectedProperty);

      closePropertyForm();

      await loadProperties();
      await loadDashboard();

      showMessage(
        wasEditing
          ? "Property updated successfully."
          : "Property added successfully."
      );

    };


  /* =====================================================
     IMAGE URL
  ===================================================== */

  const getImageUrl = (
    property
  ) => {

    const image =
      property?.image ||
      property?.images?.[0] ||
      "";

    if (!image) {

      return (
        "https://via.placeholder.com/600x400?text=No+Image"
      );

    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {

      return image;

    }

    return `${SERVER_URL}${
      image.startsWith("/")
        ? ""
        : "/"
    }${image}`;

  };


  /* =====================================================
     GET ALL PROPERTY IMAGES
  ===================================================== */

  const getPropertyImages = (
    property
  ) => {

    if (!property) {
      return [];
    }

    const images = [];

    if (property.image) {
      images.push(property.image);
    }

    if (
      Array.isArray(property.images)
    ) {

      property.images.forEach(
        (image) => {

          if (
            image &&
            !images.includes(image)
          ) {
            images.push(image);
          }

        }
      );

    }

    return images;

  };


  /* =====================================================
     FULL IMAGE URL
  ===================================================== */

  const getFullImageUrl = (
    image
  ) => {

    if (!image) {

      return (
        "https://via.placeholder.com/600x400?text=No+Image"
      );

    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {

      return image;

    }

    return `${SERVER_URL}${
      image.startsWith("/")
        ? ""
        : "/"
    }${image}`;

  };


  /* =====================================================
     VIEW PROPERTY
  ===================================================== */

  const openViewProperty = (
    property
  ) => {

    setSelectedProperty(property);

  };


  /* =====================================================
     CLOSE VIEW PROPERTY
  ===================================================== */

  const closeViewProperty = () => {

    setSelectedProperty(null);

  };


  /* =====================================================
     FILTER PROPERTIES
  ===================================================== */

  const filteredProperties =
    useMemo(() => {

      const searchText =
        search
          .trim()
          .toLowerCase();

      return properties.filter(
        (property) => {

          const title =
            String(
              property.title ||
                property.name ||
                ""
            ).toLowerCase();

          const location =
            String(
              property.location ||
                property.map_location ||
                ""
            ).toLowerCase();

          const propertyType =
            String(
              property.property_type ||
                property.propertyType ||
                property.type ||
                ""
            ).toLowerCase();

          const description =
            String(
              property.description ||
                ""
            ).toLowerCase();

          const matchesSearch =
            searchText === "" ||
            title.includes(searchText) ||
            location.includes(searchText) ||
            propertyType.includes(searchText) ||
            description.includes(searchText);

          const propertyStatus =
            String(
              property.status ||
                "Pending"
            )
              .trim()
              .toLowerCase();

          const selectedStatus =
            String(
              statusFilter ||
                "All"
            )
              .trim()
              .toLowerCase();

          const matchesStatus =
            selectedStatus === "all" ||
            propertyStatus ===
              selectedStatus;

          return (
            matchesSearch &&
            matchesStatus
          );

        }
      );

    }, [
      properties,
      search,
      statusFilter,
    ]);


  /* =====================================================
     MENU
  ===================================================== */

  const handleMenu = (
    menu
  ) => {

    setActiveMenu(menu);

  };


  /* =====================================================
     PROPERTY PERCENTAGE
  ===================================================== */

  const getPercentage = (
    value
  ) => {

    if (!stats.properties) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (value /
          stats.properties) *
          100
      )
    );

  };


  /* =====================================================
     ADMIN HOME
  ===================================================== */

  const AdminHome = () => {

    return (
      <div className="dashboard-content">

        <div className="dashboard-header">

          <div>

            <span className="dashboard-label">
              {t("ADMIN PANEL")}
            </span>

            <h1>
              {t("Home")}
            </h1>

            <p>
              {t("Welcome to the Shree Krishna Constructions Admin Panel.")}
            </p>

          </div>

          <button
            className="refresh-button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing
              ? t("Refreshing...")
              : t("Refresh")}
          </button>

        </div>


        {message && (
          <div className="admin-message">
            {t(message)}
          </div>
        )}


        <div className="section-card">

          <div className="section-title">

            <div>

              <h2>
                {t("Welcome")},{" "}
                {user?.name ||
                  t("Admin")}
              </h2>

              <span>
                {t("Manage properties and construction projects from the admin panel.")}
              </span>

            </div>

          </div>


          <div className="quick-actions">

            <button
              className="quick-card"
              onClick={() =>
                setActiveMenu(
                  "dashboard"
                )
              }
            >
              <strong>
                {t("Dashboard")}
              </strong>

              <small>
                {t("View website statistics")}
              </small>
            </button>


            <button
              className="quick-card"
              onClick={() =>
                setActiveMenu(
                  "properties"
                )
              }
            >
              <strong>
                {t("Properties")}
              </strong>

              <small>
                {t("Manage all properties")}
              </small>
            </button>


            <button
              className="quick-card"
              onClick={
                openAddProperty
              }
            >
              <strong>
                {t("Add New Property")}
              </strong>

              <small>
                {t("Create a new property listing")}
              </small>
            </button>


            <button
              className="quick-card"
              onClick={() =>
                setActiveMenu(
                  "enquiries"
                )
              }
            >
              <strong>
                {t("User Enquiries")}
              </strong>

              <small>
                {t("View user enquiries")}
              </small>
            </button>

          </div>

        </div>


        <div className="dashboard-grid">

          <div className="section-card">

            <div className="section-title">

              <div>

                <h2>
                  {t("Property Summary")}
                </h2>

                <span>
                  {t("Current property information")}
                </span>

              </div>

            </div>


            <div className="overview-item">

              <div className="overview-label">

                <span>
                  {t("Total Properties")}
                </span>

                <strong>
                  {stats.properties}
                </strong>

              </div>

            </div>


            <div className="overview-item">

              <div className="overview-label">

                <span>
                  {t("Available")}
                </span>

                <strong>
                  {stats.availableProperties}
                </strong>

              </div>

            </div>


            <div className="overview-item">

              <div className="overview-label">

                <span>
                  {t("Pending")}
                </span>

                <strong>
                  {stats.pendingProperties}
                </strong>

              </div>

            </div>


            <div className="overview-item">

              <div className="overview-label">

                <span>
                  {t("Sold")}
                </span>

                <strong>
                  {stats.soldProperties}
                </strong>

              </div>

            </div>

          </div>


          <div className="section-card">

            <div className="section-title">

              <div>

                <h2>
                  {t("Recent Properties")}
                </h2>

                <span>
                  {t("Latest property listings")}
                </span>

              </div>

              <button
                className="view-all"
                onClick={() =>
                  setActiveMenu(
                    "properties"
                  )
                }
              >
                {t("View All")}
              </button>

            </div>


            {properties
              .slice(0, 5)
              .map(
                (property) => (

                  <div
                    className="recent-property"
                    key={
                      property._id
                    }
                  >

                    <img
                      src={getImageUrl(
                        property
                      )}
                      alt={
                        property.title ||
                        "Property"
                      }
                    />

                    <div className="recent-info">

                      <strong>
                        {property.title ||
                          t("Untitled Property")}
                      </strong>

                      <p>
                        {property.location ||
                        t("Location not available")}
                      </p>

                    </div>

                    <span
                      className={`status-badge ${
                        (
                          property.status ||
                          "Pending"
                        ).toLowerCase()
                      }`}
                    >
                      {t(property.status || "Pending")}
                    </span>

                  </div>

                )
              )}


            {properties.length === 0 && (
              <div className="empty-text">
                <p>
                  {t("No properties available.")}
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    );

  };


  /* =====================================================
     DASHBOARD HOME
  ===================================================== */

  const DashboardHome = () => {

    return (
      <div className="dashboard-content">

        <div className="dashboard-header">

          <div>

            <span className="dashboard-label">
              {t("ADMIN PANEL")}
            </span>

            <h1>
              {t("Dashboard")}
            </h1>

            <p>
              {t("Welcome back")},{" "}
              <strong>
                {user?.name ||
                  t("Admin")}
              </strong>
            </p>

          </div>

          <button
            className="refresh-button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing
              ? t("Refreshing...")
              : t("Refresh")}
          </button>

        </div>


        {message && (
          <div className="admin-message">
            {t(message)}
          </div>
        )}


        <div className="admin-stats">

          <div className="stat-card blue">
            <div>
              <h3>
                {stats.properties}
              </h3>
              <p>
                {t("Total Properties")}
              </p>
            </div>
          </div>


          <div className="stat-card orange">
            <div>
              <h3>
                {stats.pendingProperties}
              </h3>
              <p>
                {t("Pending")}
              </p>
            </div>
          </div>


          <div className="stat-card green">
            <div>
              <h3>
                {stats.availableProperties}
              </h3>
              <p>
                {t("Available")}
              </p>
            </div>
          </div>


          <div className="stat-card red">
            <div>
              <h3>
                {stats.soldProperties}
              </h3>
              <p>
                {t("Sold")}
              </p>
            </div>
          </div>


          <div className="stat-card purple">
            <div>
              <h3>
                {stats.buyers}
              </h3>
              <p>
                {t("Buyers")}
              </p>
            </div>
          </div>


          <div className="stat-card pink">
            <div>
              <h3>
                {stats.favorites}
              </h3>
              <p>
                {t("Favorites")}
              </p>
            </div>
          </div>


          <div className="stat-card blue">
            <div>
              <h3>
                {enquiries.length}
              </h3>
              <p>
                {t("User Enquiries")}
              </p>
            </div>
          </div>

        </div>


        <div className="section-card">

          <div className="section-title">

            <div>

              <h2>
                {t("Quick Actions")}
              </h2>

              <span>
                {t("Manage your website quickly")}
              </span>

            </div>

          </div>


          <div className="quick-actions">

            <button
              className="quick-card"
              onClick={
                openAddProperty
              }
            >
              <strong>
                {t("Add Property")}
              </strong>

              <small>
                {t("Add a new property")}
              </small>
            </button>


            <button
              className="quick-card"
              onClick={() =>
                setActiveMenu(
                  "properties"
                )
              }
            >
              <strong>
                {t("Manage Properties")}
              </strong>

              <small>
                {t("View all properties")}
              </small>
            </button>


            <button
              className="quick-card"
              onClick={() =>
                setActiveMenu(
                  "enquiries"
                )
              }
            >
              <strong>
                {t("User Enquiries")}
              </strong>

              <small>
                {t("View enquiries")}
              </small>
            </button>

          </div>

        </div>


        <div className="dashboard-grid">

          <div className="section-card">

            <div className="section-title">

              <div>

                <h2>
                  {t("Property Overview")}
                </h2>

                <span>
                  {t("Current property status")}
                </span>

              </div>

            </div>


            <div className="overview-item">

              <div className="overview-label">

                <span>
                  {t("Available")}
                </span>

                <strong>
                  {stats.availableProperties}
                </strong>

              </div>

              <div className="progress">

                <div
                  className="progress-green"
                  style={{
                    width:
                      `${getPercentage(
                        stats.availableProperties
                      )}%`,
                  }}
                />

              </div>

            </div>


            <div className="overview-item">

              <div className="overview-label">

                <span>
                  {t("Pending")}
                </span>

                <strong>
                  {stats.pendingProperties}
                </strong>

              </div>

              <div className="progress">

                <div
                  className="progress-orange"
                  style={{
                    width:
                      `${getPercentage(
                        stats.pendingProperties
                      )}%`,
                  }}
                />

              </div>

            </div>


            <div className="overview-item">

              <div className="overview-label">

                <span>
                  {t("Sold")}
                </span>

                <strong>
                  {stats.soldProperties}
                </strong>

              </div>

              <div className="progress">

                <div
                  className="progress-red"
                  style={{
                    width:
                      `${getPercentage(
                        stats.soldProperties
                      )}%`,
                  }}
                />

              </div>

            </div>

          </div>


          <div className="section-card">

            <div className="section-title">

              <div>

                <h2>
                  {t("Recent Properties")}
                </h2>

                <span>
                  {t("Latest property listings")}
                </span>

              </div>

              <button
                className="view-all"
                onClick={() =>
                  setActiveMenu(
                    "properties"
                  )
                }
              >
                {t("View All")}
              </button>

            </div>


            {properties
              .slice(0, 5)
              .map(
                (property) => (

                  <div
                    className="recent-property"
                    key={
                      property._id
                    }
                  >

                    <img
                      src={getImageUrl(
                        property
                      )}
                      alt={
                        property.title ||
                        "Property"
                      }
                    />

                    <div className="recent-info">

                      <strong>
                        {property.title ||
                          "Untitled Property"}
                      </strong>

                      <p>
                        {property.location ||
                          "Location not available"}
                      </p>

                    </div>

                    <span
                      className={`status-badge ${
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

                )
              )}


            {properties.length === 0 && (
              <div className="empty-text">
                <p>
                  No properties
                  available.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    );

  };


  /* =====================================================
     ENQUIRY MANAGEMENT
  ===================================================== */

  const _LegacyEnquiryManagement = ({ buildRequests = false }) => {

    return (
      <div className="dashboard-content">

        <div className="dashboard-header">

          <div>

            <span className="dashboard-label">
              {t(buildRequests
                ? "CONSTRUCTION REQUESTS"
                : "USER ENQUIRIES")}
            </span>

            <h1>
              {t(buildRequests
                ? "Build on Your Land"
                : "Property Enquiries")}
            </h1>

            <p>
              {t(buildRequests
                ? "View and manage requests from users who want to build a home on their land."
                : "View and reply to enquiries from users interested in buying properties, as well as other general enquiries.")}
            </p>

          </div>

          <button
            className="refresh-button"
            onClick={
              loadEnquiries
            }
            disabled={
              enquiryLoading
            }
          >
            {enquiryLoading
              ? t("Refreshing...")
              : t("Refresh")}
          </button>

        </div>


        {message && (
          <div className="admin-message">
            {t(message)}
          </div>
        )}


        <div className="property-toolbar">

          <select
            value={
              enquiryStatusFilter
            }
            onChange={(e) =>
              setEnquiryStatusFilter(
                e.target.value
              )
            }
          >

            <option value="All">
              {t(buildRequests
                ? "All Requests"
                : "All Property Enquiries")}
            </option>

            <option value="New">
              {t("New")}
            </option>

            <option value="Contacted">
              {t("Contacted")}
            </option>

            {[
              "Site Visit Scheduled",
              "Quotation Sent",
              "In Progress",
              "Completed",
              "Cancelled",
              "Closed",
            ].map((status) => (
              <option value={status} key={status}>
                {t(status)}
              </option>
            ))}

          </select>


          <div className="property-count">
            {
              filteredEnquiries.length
            }{" "}
            {buildRequests ? t("requests") : t("enquiries")}
          </div>

        </div>

        <p className="enquiry-reply-hint">
          {t("Use Email, WhatsApp, or Call to contact customers. Open Manage to schedule visits, maintain quotations, and track construction progress.")}
        </p>

        <div className="property-table-card">

          {enquiryLoading ? (

            <div className="loading">

              <div className="spinner"></div>

              <p>
                {t("Loading enquiries...")}
              </p>

            </div>

          ) : filteredEnquiries.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                {t("Enquiries")}
              </div>

              <h3>
                {t(buildRequests
                  ? "No Build Requests Found"
                  : "No Enquiries Found")}
              </h3>

              <p>
                {t(buildRequests
                  ? "Build on Your Land submissions will appear here."
                  : "No user enquiries are available.")}
              </p>

            </div>

          ) : (

            <div className="table-wrapper">

              <table className="enquiries-table">

                <thead>

                  <tr>
                    <th>{t("User")}</th>
                    <th>{t("Phone")}</th>
                    <th>{t("Property")}</th>
                    <th>{t("Message")}</th>
                    <th>{t("Date")}</th>
                    <th>{t("Status")}</th>
                    <th>{t("Reply")}</th>
                    <th>{t("Action")}</th>
                  </tr>

                </thead>


                <tbody>

                  {filteredEnquiries.map(
                    (enquiry) => {
                      const replyDetails =
                        getEnquiryReplyDetails(enquiry, t);
                      const encodedSubject =
                        encodeURIComponent(replyDetails.subject);
                      const encodedMessage =
                        encodeURIComponent(replyDetails.message);
                      const whatsappNumber =
                        getWhatsAppNumber(enquiry.phone);
                      const quotationEmailBody = enquiry.quotation
                        ? encodeURIComponent([
                            `${t("Hi")} ${enquiry.name || t("there")},`,
                            "",
                            t("Please find your quotation details below."),
                            `${t("Amount")}: ₹${Number(enquiry.quotation.amount).toLocaleString("en-IN")}`,
                            enquiry.quotation.details || "",
                            "",
                            t("Regards,"),
                            t("Shree Krishna Constructions"),
                          ].filter(Boolean).join("\n"))
                        : "";

                      return (
                      <React.Fragment key={enquiry._id}>
                      <tr
                        key={
                          enquiry._id
                        }
                      >

                        <td>

                          <div className="enquiry-user">

                            <strong>
                              {
                                enquiry.name
                              }
                            </strong>

                            <span>
                              {
                                enquiry.email
                              }
                            </span>

                          </div>

                        </td>


                        <td>
                          {
                            enquiry.phone
                          }
                        </td>


                        <td>
                          {
                            enquiry.propertyTitle ||
                            enquiry.propertyId
                              ?.title ||
                            t("General Enquiry")
                          }
                        </td>


                        <td>

                          <div className="enquiry-message enquiry-message-preserve">
                            {
                              enquiry.message
                            }
                          </div>

                        </td>

                        <td>
                          {enquiry.createdAt
                            ? new Date(
                                enquiry.createdAt
                              ).toLocaleDateString(
                                language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN"
                              )
                            : t("N/A")}
                        </td>


                        <td>

                          <select
                            value={
                              enquiry.status ||
                              "New"
                            }
                            onChange={(e) =>
                              updateEnquiryStatus(
                                enquiry._id,
                                e.target.value
                              )
                            }
                            className="enquiry-status-select"
                          >

                            <option value="New">
                              {t("New")}
                            </option>

                            <option value="Contacted">
                              {t("Contacted")}
                            </option>

                            {[
                              "Site Visit Scheduled",
                              "Quotation Sent",
                              "In Progress",
                              "Completed",
                              "Cancelled",
                              "Closed",
                            ].map((status) => (
                              <option value={status} key={status}>
                                {t(status)}
                              </option>
                            ))}

                          </select>

                        </td>

                        <td>
                          <div className="enquiry-reply-actions">
                            {enquiry.email && (
                              <a
                                className="enquiry-reply-link email"
                                href={`mailto:${encodeURIComponent(enquiry.email)}?subject=${encodedSubject}&body=${encodedMessage}`}
                                aria-label={`Reply to ${enquiry.name || "user"} by email`}
                              >
                                {t("Email")}
                              </a>
                            )}

                            {whatsappNumber && (
                              <a
                                className="enquiry-reply-link whatsapp"
                                href={`https://wa.me/${whatsappNumber}?text=${encodedMessage}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Reply to ${enquiry.name || "user"} on WhatsApp`}
                              >
                                {t("WhatsApp")}
                              </a>
                            )}

                            {enquiry.phone && (
                              <a
                                className="enquiry-reply-link call"
                                href={`tel:${String(enquiry.phone).replace(/[^\d+]/g, "")}`}
                                aria-label={`Call ${enquiry.name || "user"}`}
                              >
                                {t("Call")}
                              </a>
                            )}
                          </div>
                        </td>


                        <td>

                          <button
                            className="edit-action"
                            type="button"
                            aria-expanded={managingEnquiryId === enquiry._id}
                            onClick={() =>
                              setManagingEnquiryId(
                                managingEnquiryId === enquiry._id
                                  ? null
                                  : enquiry._id
                              )
                            }
                          >
                            {managingEnquiryId === enquiry._id
                              ? t("Close")
                              : t("Manage")}
                          </button>

                          <button
                            className="delete-btn"
                            type="button"
                            onClick={() =>
                              handleDeleteEnquiry(
                                enquiry._id
                              )
                            }
                          >
                            {t("Delete")}
                          </button>

                        </td>

                      </tr>

                      {managingEnquiryId === enquiry._id && (
                        <tr className="enquiry-management-row" key={`${enquiry._id}-management`}>
                          <td colSpan={8}>
                            <div className="enquiry-management">
                              <div className="enquiry-management-heading">
                                <div>
                                  <h3>{t("Booking and Request Management")}</h3>
                                  <p>{t("Customer details and updates are saved to MongoDB.")}</p>
                                </div>
                                <span className="enquiry-type-badge">
                                  {t(
                                    isBuildLandRequest(enquiry)
                                      ? "Build Your Dream Home"
                                      : enquiry.requestType === "General" && !enquiry.propertyId
                                        ? "General Enquiry"
                                        : "Property Booking"
                                  )}
                                </span>
                              </div>

                              <div className="enquiry-management-grid">
                                <form
                                  className="enquiry-management-card"
                                  onSubmit={async (event) => {
                                    event.preventDefault();
                                    const form = event.currentTarget;
                                    const values = new FormData(form);
                                    const saved = await saveEnquiryManagement(enquiry._id, {
                                      siteVisit: {
                                        scheduledAt: values.get("scheduledAt"),
                                        notes: values.get("notes"),
                                      },
                                    });
                                    if (saved) form.reset();
                                  }}
                                >
                                  <h4>{t("Schedule a Site Visit")}</h4>
                                  <label>
                                    {t("Date and time")}
                                    <input
                                      name="scheduledAt"
                                      type="datetime-local"
                                      required
                                    />
                                  </label>
                                  <label>
                                    {t("Visit notes")}
                                    <textarea name="notes" rows="2" maxLength="1000" />
                                  </label>
                                  <button
                                    type="submit"
                                    className="enquiry-management-save"
                                    disabled={savingEnquiryId === enquiry._id}
                                  >
                                    {t("Save Site Visit")}
                                  </button>
                                  {enquiry.siteVisits?.length > 0 && (
                                    <ul className="enquiry-management-history">
                                      {enquiry.siteVisits.map((visit) => (
                                        <li key={visit._id}>
                                          <strong>
                                            {new Date(visit.scheduledAt).toLocaleString(
                                              language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN"
                                            )}
                                          </strong>
                                          <span>{t(visit.status)}</span>
                                          {visit.notes && <p>{visit.notes}</p>}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </form>

                                <form
                                  className="enquiry-management-card"
                                  onSubmit={async (event) => {
                                    event.preventDefault();
                                    const form = event.currentTarget;
                                    const values = new FormData(form);
                                    await saveEnquiryManagement(enquiry._id, {
                                      quotation: {
                                        amount: values.get("amount"),
                                        details: values.get("details"),
                                        status: values.get("quotationStatus"),
                                      },
                                    });
                                  }}
                                >
                                  <h4>{t("Quotation")}</h4>
                                  <label>
                                    {t("Amount (₹)")}
                                    <input
                                      name="amount"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      required
                                      defaultValue={enquiry.quotation?.amount ?? ""}
                                    />
                                  </label>
                                  <label>
                                    {t("Quotation details")}
                                    <textarea
                                      name="details"
                                      rows="2"
                                      maxLength="2000"
                                      defaultValue={enquiry.quotation?.details || ""}
                                    />
                                  </label>
                                  <label>
                                    {t("Quotation status")}
                                    <select
                                      name="quotationStatus"
                                      defaultValue={enquiry.quotation?.status || "Draft"}
                                    >
                                      {["Draft", "Sent", "Accepted", "Rejected"].map((status) => (
                                        <option key={status} value={status}>{t(status)}</option>
                                      ))}
                                    </select>
                                  </label>
                                  <button
                                    type="submit"
                                    className="enquiry-management-save"
                                    disabled={savingEnquiryId === enquiry._id}
                                  >
                                    {t("Save Quotation")}
                                  </button>
                                  {enquiry.quotation && (
                                    <>
                                      <p className="enquiry-management-meta">
                                        {t("Last updated")}: {new Date(enquiry.quotation.updatedAt).toLocaleString(
                                          language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN"
                                        )}
                                      </p>
                                      {enquiry.email && (
                                        <a
                                          className="enquiry-reply-link email"
                                          href={`mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(t("Your quotation from Shree Krishna Constructions"))}&body=${quotationEmailBody}`}
                                        >
                                          {t("Compose Quotation Email")}
                                        </a>
                                      )}
                                    </>
                                  )}
                                </form>

                                <form
                                  className="enquiry-management-card"
                                  onSubmit={async (event) => {
                                    event.preventDefault();
                                    const form = event.currentTarget;
                                    const values = new FormData(form);
                                    const saved = await saveEnquiryManagement(enquiry._id, {
                                      progressUpdate: {
                                        title: values.get("progressTitle"),
                                        description: values.get("progressDescription"),
                                        progress: values.get("progress"),
                                        status: values.get("progressStatus"),
                                      },
                                    });
                                    if (saved) form.reset();
                                  }}
                                >
                                  <h4>{t("Construction Progress")}</h4>
                                  <label>
                                    {t("Milestone")}
                                    <input name="progressTitle" type="text" required maxLength="120" />
                                  </label>
                                  <label>
                                    {t("Update details")}
                                    <textarea name="progressDescription" rows="2" maxLength="1000" />
                                  </label>
                                  <div className="enquiry-management-inline">
                                    <label>
                                      {t("Progress (%)")}
                                      <input name="progress" type="number" min="0" max="100" defaultValue="0" required />
                                    </label>
                                    <label>
                                      {t("Status")}
                                      <select name="progressStatus" defaultValue="Planned">
                                        {["Planned", "In Progress", "Completed"].map((status) => (
                                          <option key={status} value={status}>{t(status)}</option>
                                        ))}
                                      </select>
                                    </label>
                                  </div>
                                  <button
                                    type="submit"
                                    className="enquiry-management-save"
                                    disabled={savingEnquiryId === enquiry._id}
                                  >
                                    {t("Add Progress Update")}
                                  </button>
                                  {enquiry.progressUpdates?.length > 0 && (
                                    <ul className="enquiry-management-history">
                                      {enquiry.progressUpdates.map((update) => (
                                        <li key={update._id}>
                                          <strong>{update.title} · {update.progress}%</strong>
                                          <span>{t(update.status)}</span>
                                          {update.description && <p>{update.description}</p>}
                                          <small>{new Date(update.updatedAt).toLocaleDateString(
                                            language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN"
                                          )}</small>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </form>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      </React.Fragment>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>
    );

  };


  /* =====================================================
     {t("PROPERTY MANAGEMENT")}
  ===================================================== */

  const PropertyManagement = () => {

    return (
      <div className="dashboard-content">

        <div className="dashboard-header">

          <div>

            <span className="dashboard-label">
              PROPERTY MANAGEMENT
            </span>

            <h1>
              {t("Properties")}
            </h1>

            <p>
              {t("Manage all properties from one place.")}
            </p>

          </div>


          <button
            className="add-main-button"
            onClick={
              openAddProperty
            }
          >
            {t("Add New Property")}
          </button>

        </div>


        {/* TOOLBAR */}

        <div className="property-toolbar">

          <div className="search-box">

            <span>
              {t("Search")}
            </span>

            <input
              type="text"
              placeholder={t("Search by title, location or type...")}
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

            {search.trim() !== "" && (
              <button
                type="button"
                className="clear-search"
                onClick={() =>
                  setSearch("")
                }
              >
                {t("Clear")}
              </button>
            )}

          </div>


          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >

            <option value="All">
              {t("All Status")}
            </option>

            <option value="Pending">
              {t("Pending")}
            </option>

            <option value="Available">
              {t("Available")}
            </option>

            <option value="Sold">
              {t("Sold")}
            </option>
            <option value="Rejected">
              {t("Rejected")}
            </option>

          </select>


          <div className="property-count">
            {
              filteredProperties.length
            }{" "}
            {t("properties")}
          </div>

        </div>


        {search.trim() !== "" && (
          <div className="search-result-info">
            {t("Showing")}{" "}
            {
              filteredProperties.length
            }{" "}
            of{" "}
            {properties.length}{" "}
            properties for "
            {search}"
          </div>
        )}


        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}


        <div className="property-table-card">

          {loading ? (

            <div className="loading">

              <div className="spinner"></div>

              <p>
                {t("Loading properties...")}
              </p>

            </div>

          ) : filteredProperties.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                {t("Property")}
              </div>

              <h3>
                {t("No Properties Found")}
              </h3>

              <p>
                {t("Try changing your search or add a new property.")}
              </p>

              <button
                onClick={
                  openAddProperty
                }
              >
                {t("Add Property")}
              </button>

            </div>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>
                      {t("Property")}
                    </th>

                    <th>
                      {t("Type")}
                    </th>

                    <th>
                      {t("Location")}
                    </th>

                    <th>
                      {t("Price")}
                    </th>

                    <th>
                      {t("Status")}
                    </th>

                    <th>
                      {t("Actions")}
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredProperties.map(
                    (property) => (

                      <tr
                        key={
                          property._id
                        }
                      >

                        <td>

                          <div className="property-info">

                            <img
                              src={getImageUrl(
                                property
                              )}
                              alt={
                                property.title ||
                                "Property"
                              }
                            />

                            <div>

                              <strong>
                                {
                                  property.title ||
                                  t("Untitled Property")
                                }
                              </strong>

                              <small>
                                {
                                  property.bedrooms ||
                                  0
                                }{" "}
                                {t("Beds")} •{" "}
                                {
                                  property.bathrooms ||
                                  0
                                }{" "}
                                {t("Baths")}
                              </small>

                            </div>

                          </div>

                        </td>


                        <td>

                          <span className="type-badge">

                            {t(
                              property.property_type ||
                              property.propertyType ||
                              property.type ||
                              "House"
                            )}

                          </span>

                        </td>


                        <td>

                          <span className="location-text">

                            {
                              property.location ||
                              property.map_location ||
                              "N/A"
                            }

                          </span>

                        </td>


                        <td>

                          <strong className="price-text">

                            ₹
                            {Number(
                              property.price ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}

                          </strong>

                        </td>


                        <td>

                          <div className="property-status-control">
                            <span
                              className={`status-badge ${
                                (
                                  t(property.status || "Pending")
                                ).toLowerCase()
                              }`}
                            >
                              {
                                property.status ||
                                "Pending"
                              }
                            </span>

                            <select
                              className="property-status-select"
                              aria-label={`Set status for ${property.title ||                               t("Property")}`}
                              value={property.status || "Pending"}
                              disabled={updatingStatusId === property._id}
                              onChange={(event) =>
                                handleStatusChange(
                                  property._id,
                                  event.target.value
                                )
                              }
                            >
                              <option value="Pending">
                                {t("Pending")}
                              </option>
                              <option value="Available">
                                {t("Available")}
                              </option>
                              <option value="Sold">
                                {t("Sold")}
                              </option>
                            </select>
                          </div>

                        </td>


                        <td>

                          <div className="action-buttons">

                            <button
                              className="view-action"
                              onClick={() =>
                                openViewProperty(
                                  property
                                )
                              }
                            >
                              {t("View")}
                            </button>


                            <button
                              className="edit-action"
                              onClick={() =>
                                openEditProperty(
                                  property
                                )
                              }
                            >
                              {t("Edit")}
                            </button>


                            <button
                              className="delete-btn"
                              onClick={() =>
                                handleDelete(
                                  property._id
                                )
                              }
                            >
                              {t("Delete")}
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>
    );

  };


  /* =====================================================
     MAIN RETURN
  ===================================================== */

  return (

    <div className="admin-dashboard">

      {/* =================================================
          ADMIN NAVBAR
      ================================================= */}

      <AdminNavbar
        activeMenu={activeMenu}
        buildRequestCount={buildRequestCount}
        setActiveMenu={
          setActiveMenu
        }
        onAddProperty={
          openAddProperty
        }
      />


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="admin-main">

        {activeMenu === "home" && (
          <AdminHome />
        )}

        {activeMenu === "dashboard" && (
          <DashboardHome />
        )}

        {activeMenu === "properties" && (
          <PropertyManagement />
        )}

        {activeMenu === "enquiries" && (
          <CustomerRequestManagement
            buildRequests={false}
            enquiries={enquiries}
            loading={enquiryLoading}
            error={enquiryError}
            notice={message}
            savingEnquiryId={savingEnquiryId}
            onRefresh={loadEnquiries}
            onDelete={handleDeleteEnquiry}
            onSave={saveEnquiryManagement}
            onStatusChange={updateEnquiryStatus}
            onInitiateBooking={initiateBooking}
            onSelectType={setActiveMenu}
          />
        )}

        {activeMenu === "build-requests" && (
          <CustomerRequestManagement
            buildRequests
            enquiries={enquiries}
            loading={enquiryLoading}
            error={enquiryError}
            notice={message}
            savingEnquiryId={savingEnquiryId}
            onRefresh={loadEnquiries}
            onDelete={handleDeleteEnquiry}
            onSave={saveEnquiryManagement}
            onStatusChange={updateEnquiryStatus}
            onSelectType={setActiveMenu}
          />
        )}

        {activeMenu === "bookings" && (
          <BookingManagement
            properties={properties}
            onBookingUpdated={loadDashboard}
          />
        )}

        {activeMenu === "reviews" && (
          <AdminReviewManagement />
        )}

      </main>


      {/* =================================================
          PROPERTY ADD / EDIT MODAL
      ================================================= */}

      {showPropertyModal && (

        <PropertyForm
          property={
            selectedProperty
          }

          onClose={
            closePropertyForm
          }

          onSuccess={
            handlePropertySuccess
          }
        />

      )}


      {/* =================================================
          VIEW PROPERTY MODAL
      ================================================= */}

      {selectedProperty &&
        !showPropertyModal && (

          <div
            className="admin-view-overlay"
            onClick={
              closeViewProperty
            }
          >

            <div
              className="admin-view-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="admin-view-header">

                <div>

                  <span className="dashboard-label">
                    {t("PROPERTY DETAILS")}
                  </span>

                  <h2>
                    {selectedProperty.title || t("Property Details")}
                  </h2>

                </div>


                <button
                  className="admin-view-close"
                  onClick={
                    closeViewProperty
                  }
                  type="button"
                >
                  ×
                </button>

              </div>


              {/* IMAGE GALLERY */}

              <div className="admin-view-gallery">

                {getPropertyImages(
                  selectedProperty
                ).length > 0 ? (

                  getPropertyImages(
                    selectedProperty
                  ).map(
                    (image, index) => (

                      <img
                        key={`${image}-${index}`}
                        src={getFullImageUrl(
                          image
                        )}
                        alt={`${t("Property")} ${
                          index + 1
                        }`}
                      />

                    )
                  )

                ) : (

                  <img
                    src={getImageUrl(
                      selectedProperty
                    )}
                    alt={t("Property")}
                  />

                )}

              </div>


              {/* PROPERTY INFORMATION */}

              <div className="admin-view-body">

                <div className="admin-view-price">

                  ₹
                  {Number(
                    selectedProperty.price ||
                      0
                  ).toLocaleString(
                    "en-IN"
                  )}

                </div>


                <span
                  className={`status-badge ${
                    (
                      selectedProperty.status ||
                      "Pending"
                    ).toLowerCase()
                  }`}
                >
                  {t(selectedProperty.status || "Pending")}
                </span>

                <div className="admin-view-status-control">
                  <label htmlFor="admin-view-property-status">{t("Update property status")}</label>
                  <select
                    id="admin-view-property-status"
                    className="property-status-select"
                    value={selectedProperty.status || "Pending"}
                    disabled={
                      updatingStatusId === selectedProperty._id ||
                      Boolean(selectedProperty.reservedBooking) ||
                      selectedProperty.status === "Reserved"
                    }
                    onChange={(event) => handleStatusChange(selectedProperty._id, event.target.value)}
                  >
                    {["Pending", "Available", "Reserved", "Sold", "Rejected"].map((status) => (
                      <option value={status} key={status}>{t(status)}</option>
                    ))}
                  </select>
                  {updatingStatusId === selectedProperty._id && (
                    <span role="status">{t("Saving...")}</span>
                  )}
                </div>


                <div className="admin-view-info-grid">

                  <div>

                    <span>
                      {t("Property Type")}
                    </span>

                    <strong>
                      {t(
                        selectedProperty.property_type ||
                        selectedProperty.propertyType ||
                        selectedProperty.type ||
                        "House"
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      {t("Location")}
                    </span>

                    <strong>
                      {
                        selectedProperty.location ||
                        selectedProperty.map_location ||
                        "N/A"
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      {t("Bedrooms")}
                    </span>

                    <strong>
                      {
                        selectedProperty.bedrooms ??
                        0
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      {t("Bathrooms")}
                    </span>

                    <strong>
                      {
                        selectedProperty.bathrooms ??
                        0
                      }
                    </strong>

                  </div>


                  <div>

                    <span>
                      {t("Area")}
                    </span>

                    <strong>
                      {
                        selectedProperty.area_sqft ??
                        0
                      }{" "}
                      {t("Sq. Ft.")}
                    </strong>

                  </div>


                  <div>

                    <span>
                      {t("Featured")}
                    </span>

                    <strong>
                      {
                        selectedProperty.featured
                          ? t("Yes")
                          : t("No")
                      }
                    </strong>

                  </div>

                </div>


                {/* DESCRIPTION */}

                <div className="admin-view-description">

                  <h3>
                    {t("Description")}
                  </h3>

                  <p>
                    {selectedProperty.description || t("No description available.")}
                  </p>

                </div>


                {/* VIDEO */}

                {selectedProperty.video && (

                  <div className="admin-view-video">

                    <h3>
                      {t("Property Video")}
                    </h3>

                    <video
                      src={getFullImageUrl(
                        selectedProperty.video
                      )}
                      controls
                    />

                  </div>

                )}


                {/* MAP LOCATION */}

                {selectedProperty.map_location && (

                  <div className="admin-view-location">

                    <h3>
                      {t("Map Location")}
                    </h3>

                    <p>
                      {
                        selectedProperty.map_location
                      }
                    </p>

                  </div>

                )}


                {/* ACTIONS */}

                <div className="admin-view-actions">

                  <button
                    type="button"
                    className="admin-view-edit-btn"
                    onClick={() =>
                      openEditProperty(
                        selectedProperty
                      )
                    }
                  >
                    {t("Edit Property")}
                  </button>


                  <button
                    type="button"
                    className="admin-view-close-btn"
                    onClick={
                      closeViewProperty
                    }
                  >
                    {t("Close")}
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

    </div>

  );

}

export default AdminDashboard;