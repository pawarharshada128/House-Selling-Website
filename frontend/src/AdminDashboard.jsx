import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PropertyForm from "./PropertyForm";
import ProjectForm from "./ProjectForm";
import "./AdminDashboard.css";

// const API_URL = "http://localhost:5000/api";
// const SERVER_URL = "http://localhost:5000";
const API_URL = "https://house-selling-website.onrender.com/api";
const SERVER_URL = "https://house-selling-website.onrender.com";
function AdminDashboard() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [activeMenu, setActiveMenu] = useState("home");

  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const [selectedProperty, setSelectedProperty] = useState(null);

  const [properties, setProperties] = useState([]);

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

  // =====================================================
  // ENQUIRY STATE
  // =====================================================

  const [enquiries, setEnquiries] = useState([]);
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquiryStatusFilter, setEnquiryStatusFilter] =
    useState("All");

  // =====================================================
  // PROPERTY SEARCH / FILTER
  // =====================================================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // =====================================================
  // GENERAL STATE
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  // =====================================================
  // LOGIN DATA
  // =====================================================

  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  // =====================================================
  // CHECK ADMIN + INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!token || user?.role !== "admin") {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    loadDashboard();
    loadProperties();
    loadEnquiries();
  }, [token, user?.role]);

  // =====================================================
  // MESSAGE
  // =====================================================

  const showMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  const loadDashboard = async () => {
    try {
      const response = await fetch(
        `${API_URL}/admin/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load dashboard.");
      }

      const data = await response.json();

      setStats({
        properties: data.properties || 0,
        pendingProperties: data.pendingProperties || 0,
        availableProperties: data.availableProperties || 0,
        soldProperties: data.soldProperties || 0,
        buyers: data.buyers || 0,
        inquiries: data.inquiries || 0,
        bookings: data.bookings || 0,
        favorites: data.favorites || 0,
        revenue: data.revenue || 0,
      });
    } catch (error) {
      console.error("Dashboard error:", error);

      setMessage(
        "Unable to load dashboard statistics."
      );
    }
  };

  // =====================================================
  // LOAD PROPERTIES
  // =====================================================

  const loadProperties = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/properties`
      );

      if (!response.ok) {
        throw new Error("Failed to load properties.");
      }

      const data = await response.json();

      const propertyList = Array.isArray(data)
        ? data
        : Array.isArray(data.properties)
        ? data.properties
        : Array.isArray(data.data)
        ? data.data
        : [];

      console.log("API PROPERTY DATA:", data);
      console.log("PROPERTY LIST:", propertyList);

      setProperties(propertyList);
    } catch (error) {
      console.error("Properties error:", error);

      setMessage("Unable to load properties.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD ENQUIRIES
  // =====================================================

  const loadEnquiries = async () => {
    try {
      setEnquiryLoading(true);

      const response = await fetch(
        `${API_URL}/enquiries`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load enquiries.");
      }

      const data = await response.json();

      const enquiryList = Array.isArray(data)
        ? data
        : Array.isArray(data.enquiries)
        ? data.enquiries
        : Array.isArray(data.data)
        ? data.data
        : [];

      setEnquiries(enquiryList);
    } catch (error) {
      console.error("Enquiries error:", error);

      setMessage("Unable to load user enquiries.");
    } finally {
      setEnquiryLoading(false);
    }
  };

  // =====================================================
  // DELETE ENQUIRY
  // =====================================================

  const handleDeleteEnquiry = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this enquiry?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/enquiries/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete enquiry."
        );
      }

      showMessage("Enquiry deleted successfully.");

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

  // =====================================================
  // UPDATE ENQUIRY STATUS
  // =====================================================

  const updateEnquiryStatus = async (
    id,
    status
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/enquiries/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update enquiry."
        );
      }

      setEnquiries((previous) =>
        previous.map((enquiry) =>
          enquiry._id === id
            ? {
                ...enquiry,
                status,
              }
            : enquiry
        )
      );

      showMessage("Enquiry status updated.");
    } catch (error) {
      console.error(
        "Update enquiry status error:",
        error
      );

      showMessage(
        error.message ||
          "Failed to update enquiry."
      );
    }
  };

  // =====================================================
  // FILTER ENQUIRIES
  // =====================================================

  const filteredEnquiries = useMemo(() => {
    if (enquiryStatusFilter === "All") {
      return enquiries;
    }

    return enquiries.filter(
      (enquiry) =>
        String(enquiry.status || "New")
          .toLowerCase() ===
        enquiryStatusFilter.toLowerCase()
    );
  }, [
    enquiries,
    enquiryStatusFilter,
  ]);

  // =====================================================
  // REFRESH
  // =====================================================

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

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  // =====================================================
  // DELETE PROPERTY
  // =====================================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this property?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
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
      console.error("Delete error:", error);

      showMessage(
        error.message ||
          "Failed to delete property."
      );
    }
  };

  // =====================================================
  // ADD PROPERTY
  // =====================================================

  const openAddProperty = () => {
    setSelectedProperty(null);
    setShowPropertyModal(true);
  };

  // =====================================================
  // EDIT PROPERTY
  // =====================================================

  const openEditProperty = (property) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
  };

  // =====================================================
  // CLOSE PROPERTY FORM
  // =====================================================

  const closePropertyForm = () => {
    setShowPropertyModal(false);
    setSelectedProperty(null);
  };

  // =====================================================
  // PROPERTY SUCCESS
  // =====================================================

  const handlePropertySuccess = async () => {
    const wasEditing = Boolean(selectedProperty);

    closePropertyForm();

    await loadProperties();
    await loadDashboard();

    showMessage(
      wasEditing
        ? "Property updated successfully."
        : "Property added successfully."
    );
  };

  // =====================================================
  // PROJECT SUCCESS
  // =====================================================

  const handleProjectSuccess = () => {
    setShowProjectModal(false);

    showMessage(
      "Project added successfully."
    );
  };

  // =====================================================
  // IMAGE URL
  // =====================================================

  const getImageUrl = (property) => {
    const image =
      property?.image ||
      property?.images?.[0] ||
      "";

    if (!image) {
      return "https://via.placeholder.com/600x400?text=No+Image";
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

  // =====================================================
  // GET ALL PROPERTY IMAGES
  // =====================================================

  const getPropertyImages = (property) => {
    if (!property) {
      return [];
    }

    const images = [];

    if (property.image) {
      images.push(property.image);
    }

    if (Array.isArray(property.images)) {
      property.images.forEach((image) => {
        if (image && !images.includes(image)) {
          images.push(image);
        }
      });
    }

    return images;
  };

  // =====================================================
  // PROPERTY IMAGE URL
  // =====================================================

  const getFullImageUrl = (image) => {
    if (!image) {
      return "https://via.placeholder.com/600x400?text=No+Image";
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

  // =====================================================
  // VIEW PROPERTY
  // =====================================================

  const openViewProperty = (property) => {
    setSelectedProperty(property);
  };

  // =====================================================
  // CLOSE VIEW PROPERTY
  // =====================================================

  const closeViewProperty = () => {
    setSelectedProperty(null);
  };

  // =====================================================
  // FILTER PROPERTIES
  // =====================================================

  const filteredProperties = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return properties.filter((property) => {
      const title = String(
        property.title ||
          property.name ||
          ""
      ).toLowerCase();

      const location = String(
        property.location ||
          property.map_location ||
          ""
      ).toLowerCase();

      const propertyType = String(
        property.property_type ||
          property.propertyType ||
          property.type ||
          ""
      ).toLowerCase();

      const description = String(
        property.description || ""
      ).toLowerCase();

      const matchesSearch =
        searchText === "" ||
        title.includes(searchText) ||
        location.includes(searchText) ||
        propertyType.includes(searchText) ||
        description.includes(searchText);

      const propertyStatus = String(
        property.status || "Pending"
      )
        .trim()
        .toLowerCase();

      const selectedStatus = String(
        statusFilter || "All"
      )
        .trim()
        .toLowerCase();

      const matchesStatus =
        selectedStatus === "all" ||
        propertyStatus === selectedStatus;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    properties,
    search,
    statusFilter,
  ]);

  // =====================================================
  // MENU
  // =====================================================

  const handleMenu = (menu) => {
    setActiveMenu(menu);
  };

  // =====================================================
  // PROPERTY PERCENTAGE
  // =====================================================

  const getPercentage = (value) => {
    if (!stats.properties) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (value / stats.properties) * 100
      )
    );
  };

  // =====================================================
  // ADMIN HOME
  // =====================================================

  const AdminHome = () => {
    return (
      <div className="dashboard-content">

        <div className="dashboard-header">

          <div>
            <span className="dashboard-label">
              ADMIN PANEL
            </span>

            <h1>Home</h1>

            <p>
              Welcome to the Shree Krishna
              Constructions Admin Panel.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}

        <div className="section-card">

          <div className="section-title">

            <div>
              <h2>
                Welcome,{" "}
                {user?.name || "Admin"}
              </h2>

              <span>
                Manage properties and
                construction projects from
                the admin panel.
              </span>
            </div>

          </div>

          <div className="quick-actions">

            <button
              className="quick-card"
              onClick={() =>
                setActiveMenu("dashboard")
              }
            >
              <strong>
                Dashboard
              </strong>

              <small>
                View website statistics
              </small>
            </button>

            <button
              className="quick-card"
              onClick={() =>
                setActiveMenu("properties")
              }
            >
              <strong>
                Properties
              </strong>

              <small>
                Manage all properties
              </small>
            </button>

            <button
              className="quick-card"
              onClick={openAddProperty}
            >
              <strong>
                Add New Property
              </strong>

              <small>
                Create a new property
                listing
              </small>
            </button>

            <button
              className="quick-card"
              onClick={() =>
                setShowProjectModal(true)
              }
            >
              <strong>
                New Project
              </strong>

              <small>
                Add a construction project
              </small>
            </button>

            <button
              className="quick-card"
              onClick={() =>
                setActiveMenu("enquiries")
              }
            >
              <strong>
                User Enquiries
              </strong>

              <small>
                View user enquiries
              </small>
            </button>

          </div>

        </div>

        <div className="dashboard-grid">

          <div className="section-card">

            <div className="section-title">

              <div>
                <h2>
                  Property Summary
                </h2>

                <span>
                  Current property
                  information
                </span>
              </div>

            </div>

            <div className="overview-item">
              <div className="overview-label">
                <span>
                  Total Properties
                </span>

                <strong>
                  {stats.properties}
                </strong>
              </div>
            </div>

            <div className="overview-item">
              <div className="overview-label">
                <span>
                  Available
                </span>

                <strong>
                  {stats.availableProperties}
                </strong>
              </div>
            </div>

            <div className="overview-item">
              <div className="overview-label">
                <span>
                  Pending
                </span>

                <strong>
                  {stats.pendingProperties}
                </strong>
              </div>
            </div>

            <div className="overview-item">
              <div className="overview-label">
                <span>
                  Sold
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
                  Recent Properties
                </h2>

                <span>
                  Latest property listings
                </span>
              </div>

              <button
                className="view-all"
                onClick={() =>
                  setActiveMenu("properties")
                }
              >
                View All
              </button>

            </div>

            {properties
              .slice(0, 5)
              .map((property) => (
                <div
                  className="recent-property"
                  key={property._id}
                >

                  <img
                    src={getImageUrl(property)}
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
              ))}

            {properties.length === 0 && (
              <div className="empty-text">
                <p>
                  No properties available.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    );
  };

  // =====================================================
  // DASHBOARD HOME
  // =====================================================

  const DashboardHome = () => {
    return (
      <div className="dashboard-content">

        <div className="dashboard-header">

          <div>
            <span className="dashboard-label">
              ADMIN PANEL
            </span>

            <h1>Dashboard</h1>

            <p>
              Welcome back,{" "}
              <strong>
                {user?.name || "Admin"}
              </strong>
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}

        <div className="admin-stats">

          <div className="stat-card blue">
            <div>
              <h3>
                {stats.properties}
              </h3>
              <p>
                Total Properties
              </p>
            </div>
          </div>

          <div className="stat-card orange">
            <div>
              <h3>
                {stats.pendingProperties}
              </h3>
              <p>
                Pending
              </p>
            </div>
          </div>

          <div className="stat-card green">
            <div>
              <h3>
                {stats.availableProperties}
              </h3>
              <p>
                Available
              </p>
            </div>
          </div>

          <div className="stat-card red">
            <div>
              <h3>
                {stats.soldProperties}
              </h3>
              <p>
                Sold
              </p>
            </div>
          </div>

          <div className="stat-card purple">
            <div>
              <h3>
                {stats.buyers}
              </h3>
              <p>
                Buyers
              </p>
            </div>
          </div>

          <div className="stat-card pink">
            <div>
              <h3>
                {stats.favorites}
              </h3>
              <p>
                Favorites
              </p>
            </div>
          </div>

          <div className="stat-card blue">
            <div>
              <h3>
                {enquiries.length}
              </h3>
              <p>
                User Enquiries
              </p>
            </div>
          </div>

        </div>

        <div className="section-card">

          <div className="section-title">

            <div>
              <h2>
                Quick Actions
              </h2>

              <span>
                Manage your website quickly
              </span>
            </div>

          </div>

          <div className="quick-actions">

            <button
              className="quick-card"
              onClick={openAddProperty}
            >
              <strong>
                Add Property
              </strong>

              <small>
                Add a new property
              </small>
            </button>

            <button
              className="quick-card"
              onClick={() =>
                setShowProjectModal(true)
              }
            >
              <strong>
                New Project
              </strong>

              <small>
                Add construction project
              </small>
            </button>

            <button
              className="quick-card"
              onClick={() =>
                setActiveMenu("properties")
              }
            >
              <strong>
                Manage Properties
              </strong>

              <small>
                View all properties
              </small>
            </button>

            <button
              className="quick-card"
              onClick={() =>
                setActiveMenu("enquiries")
              }
            >
              <strong>
                User Enquiries
              </strong>

              <small>
                View enquiries
              </small>
            </button>

          </div>

        </div>

        <div className="dashboard-grid">

          <div className="section-card">

            <div className="section-title">

              <div>
                <h2>
                  Property Overview
                </h2>

                <span>
                  Current property status
                </span>
              </div>

            </div>

            <div className="overview-item">

              <div className="overview-label">
                <span>
                  Available
                </span>

                <strong>
                  {stats.availableProperties}
                </strong>
              </div>

              <div className="progress">

                <div
                  className="progress-green"
                  style={{
                    width: `${getPercentage(
                      stats.availableProperties
                    )}%`,
                  }}
                />

              </div>

            </div>

            <div className="overview-item">

              <div className="overview-label">
                <span>
                  Pending
                </span>

                <strong>
                  {stats.pendingProperties}
                </strong>
              </div>

              <div className="progress">

                <div
                  className="progress-orange"
                  style={{
                    width: `${getPercentage(
                      stats.pendingProperties
                    )}%`,
                  }}
                />

              </div>

            </div>

            <div className="overview-item">

              <div className="overview-label">
                <span>
                  Sold
                </span>

                <strong>
                  {stats.soldProperties}
                </strong>
              </div>

              <div className="progress">

                <div
                  className="progress-red"
                  style={{
                    width: `${getPercentage(
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
                  Recent Properties
                </h2>

                <span>
                  Latest property listings
                </span>
              </div>

              <button
                className="view-all"
                onClick={() =>
                  setActiveMenu("properties")
                }
              >
                View All
              </button>

            </div>

            {properties
              .slice(0, 5)
              .map((property) => (
                <div
                  className="recent-property"
                  key={property._id}
                >

                  <img
                    src={getImageUrl(property)}
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
              ))}

            {properties.length === 0 && (
              <div className="empty-text">
                <p>
                  No properties available.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    );
  };

  // =====================================================
  // ENQUIRY MANAGEMENT
  // =====================================================

  const EnquiryManagement = () => {
    return (
      <div className="dashboard-content">

        <div className="dashboard-header">

          <div>
            <span className="dashboard-label">
              USER ENQUIRIES
            </span>

            <h1>Enquiries</h1>

            <p>
              View and manage enquiries
              submitted by users.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadEnquiries}
            disabled={enquiryLoading}
          >
            {enquiryLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

        {message && (
          <div className="admin-message">
            {message}
          </div>
        )}

        <div className="property-toolbar">

          <select
            value={enquiryStatusFilter}
            onChange={(e) =>
              setEnquiryStatusFilter(
                e.target.value
              )
            }
          >
            <option value="All">
              All Enquiries
            </option>

            <option value="New">
              New
            </option>

            <option value="Contacted">
              Contacted
            </option>

            <option value="Closed">
              Closed
            </option>
          </select>

          <div className="property-count">
            {filteredEnquiries.length} enquiries
          </div>

        </div>

        <div className="property-table-card">

          {enquiryLoading ? (

            <div className="loading">

              <div className="spinner"></div>

              <p>
                Loading enquiries...
              </p>

            </div>

          ) : filteredEnquiries.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                Enquiries
              </div>

              <h3>
                No Enquiries Found
              </h3>

              <p>
                No user enquiries are
                available.
              </p>

            </div>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>
                    <th>User</th>
                    <th>Phone</th>
                    <th>Property</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredEnquiries.map(
                    (enquiry) => (
                      <tr
                        key={enquiry._id}
                      >

                        <td>

                          <div className="enquiry-user">

                            <strong>
                              {enquiry.name}
                            </strong>

                            <span>
                              {enquiry.email}
                            </span>

                          </div>

                        </td>

                        <td>
                          {enquiry.phone}
                        </td>

                        <td>
                          {enquiry.propertyTitle ||
                            enquiry.propertyId
                              ?.title ||
                            "General Enquiry"}
                        </td>

                        <td>

                          <div className="enquiry-message">
                            {enquiry.message}
                          </div>

                        </td>

                        <td>
                          {enquiry.createdAt
                            ? new Date(
                                enquiry.createdAt
                              ).toLocaleDateString(
                                "en-IN"
                              )
                            : "N/A"}
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
                              New
                            </option>

                            <option value="Contacted">
                              Contacted
                            </option>

                            <option value="Closed">
                              Closed
                            </option>

                          </select>

                        </td>

                        <td>

                          <button
                            className="delete-btn"
                            onClick={() =>
                              handleDeleteEnquiry(
                                enquiry._id
                              )
                            }
                          >
                            Delete
                          </button>

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

  // =====================================================
  // PROPERTY MANAGEMENT
  // =====================================================

  const PropertyManagement = () => {
    return (
      <div className="dashboard-content">

        <div className="dashboard-header">

          <div>

            <span className="dashboard-label">
              PROPERTY MANAGEMENT
            </span>

            <h1>
              Properties
            </h1>

            <p>
              Manage all properties
              from one place.
            </p>

          </div>

          <button
            className="add-main-button"
            onClick={openAddProperty}
          >
            Add New Property
          </button>

        </div>

        {/* TOOLBAR */}

        <div className="property-toolbar">

          <div className="search-box">

            <span>
              Search
            </span>

            <input
              type="text"
              placeholder="Search by title, location or type..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
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
                Clear
              </button>
            )}

          </div>

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

            <option value="Approved">
              Approved
            </option>

            <option value="Available">
              Available
            </option>

            <option value="Sold">
              Sold
            </option>

          </select>

          <div className="property-count">
            {filteredProperties.length} properties
          </div>

        </div>

        {search.trim() !== "" && (
          <div className="search-result-info">
            Showing{" "}
            {filteredProperties.length} of{" "}
            {properties.length} properties for "
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
                Loading properties...
              </p>

            </div>

          ) : filteredProperties.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                Property
              </div>

              <h3>
                No Properties Found
              </h3>

              <p>
                Try changing your search
                or add a new property.
              </p>

              <button
                onClick={openAddProperty}
              >
                Add Property
              </button>

            </div>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>

                    <th>
                      Property
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Location
                    </th>

                    <th>
                      Price
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredProperties.map(
                    (property) => (
                      <tr
                        key={property._id}
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
                                {property.title ||
                                  "Untitled Property"}
                              </strong>

                              <small>
                                {property.bedrooms ||
                                  0}{" "}
                                Beds •{" "}
                                {property.bathrooms ||
                                  0}{" "}
                                Baths
                              </small>

                            </div>

                          </div>

                        </td>

                        <td>

                          <span className="type-badge">

                            {property.property_type ||
                              property.propertyType ||
                              property.type ||
                              "House"}

                          </span>

                        </td>

                        <td>

                          <span className="location-text">

                            {property.location ||
                              property.map_location ||
                              "N/A"}

                          </span>

                        </td>

                        <td>

                          <strong className="price-text">

                            ₹
                            {Number(
                              property.price || 0
                            ).toLocaleString(
                              "en-IN"
                            )}

                          </strong>

                        </td>

                        <td>

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

                        </td>

                        <td>

                          <div className="action-buttons">

                            {/* VIEW - FIXED */}

                            <button
                              className="view-action"
                              onClick={() =>
                                openViewProperty(
                                  property
                                )
                              }
                            >
                              View
                            </button>

                            {/* EDIT - FIXED */}

                            <button
                              className="edit-action"
                              onClick={() =>
                                openEditProperty(
                                  property
                                )
                              }
                            >
                              Edit
                            </button>

                            {/* DELETE */}

                            <button
                              className="delete-btn"
                              onClick={() =>
                                handleDelete(
                                  property._id
                                )
                              }
                            >
                              Delete
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

  // =====================================================
  // MAIN RETURN
  // =====================================================

  return (
    <div className="admin-dashboard">

      {/* SIDEBAR */}

      <aside className="admin-sidebar">

        {/* LOGO */}

        <div className="admin-logo">

          <img
            src="/logo.jpeg"
            alt="SK Constructions Logo"
          />

          <div>

            <strong>
              SK Constructions
            </strong>

            <span>
              Admin Panel
            </span>

          </div>

        </div>

        {/* MENU */}

        <nav className="admin-menu">

          {/* HOME */}

          <button
            className={
              activeMenu === "home"
                ? "active"
                : ""
            }
            onClick={() =>
              handleMenu("home")
            }
          >
            <span>
              Home
            </span>
          </button>

          {/* DASHBOARD */}

          <button
            className={
              activeMenu === "dashboard"
                ? "active"
                : ""
            }
            onClick={() =>
              handleMenu("dashboard")
            }
          >
            <span>
              Dashboard
            </span>
          </button>

          {/* PROPERTIES */}

          <button
            className={
              activeMenu === "properties"
                ? "active"
                : ""
            }
            onClick={() =>
              handleMenu("properties")
            }
          >
            <span>
              Properties
            </span>
          </button>

          {/* ADD PROPERTY */}

          <button
            onClick={openAddProperty}
          >
            <span>
              Add New Property
            </span>
          </button>

          {/* NEW PROJECT */}

          <button
            onClick={() =>
              setShowProjectModal(true)
            }
          >
            <span>
              New Project
            </span>
          </button>

          {/* USER ENQUIRIES */}

          <button
            className={
              activeMenu === "enquiries"
                ? "active"
                : ""
            }
            onClick={() =>
              handleMenu("enquiries")
            }
          >
            <span>
              User Enquiries
            </span>
          </button>

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

          {/* USER */}

          <div className="admin-user">

            <div className="admin-avatar">

              {(user?.name || "A")
                .charAt(0)
                .toUpperCase()}

            </div>

            <div>

              <strong>
                {user?.name || "Admin"}
              </strong>

              <small>
                Administrator
              </small>

            </div>

          </div>

          {/* LOGOUT */}

          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}

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
          <EnquiryManagement />
        )}

      </main>

      {/* =================================================
          PROPERTY EDIT / ADD MODAL
      ================================================= */}

      {showPropertyModal && (
        <PropertyForm
          property={selectedProperty}
          onClose={closePropertyForm}
          onSuccess={handlePropertySuccess}
        />
      )}

      {/* =================================================
          PROJECT MODAL
      ================================================= */}

      {showProjectModal && (
        <ProjectForm
          onClose={() =>
            setShowProjectModal(false)
          }
          onSuccess={handleProjectSuccess}
        />
      )}

      {/* =================================================
          VIEW PROPERTY MODAL
      ================================================= */}

      {selectedProperty &&
        !showPropertyModal && (
          <div
            className="admin-view-overlay"
            onClick={closeViewProperty}
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
                    PROPERTY DETAILS
                  </span>

                  <h2>
                    {selectedProperty.title ||
                      "Property Details"}
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
                        alt={`Property ${
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
                    alt="Property"
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
                  {selectedProperty.status ||
                    "Pending"}
                </span>

                <div className="admin-view-info-grid">

                  <div>
                    <span>
                      Property Type
                    </span>

                    <strong>
                      {selectedProperty.property_type ||
                        selectedProperty.propertyType ||
                        selectedProperty.type ||
                        "House"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Location
                    </span>

                    <strong>
                      {selectedProperty.location ||
                        selectedProperty.map_location ||
                        "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Bedrooms
                    </span>

                    <strong>
                      {selectedProperty.bedrooms ??
                        0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Bathrooms
                    </span>

                    <strong>
                      {selectedProperty.bathrooms ??
                        0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Area
                    </span>

                    <strong>
                      {selectedProperty.area_sqft ??
                        0}{" "}
                      Sq. Ft.
                    </strong>
                  </div>

                  <div>
                    <span>
                      Featured
                    </span>

                    <strong>
                      {selectedProperty.featured
                        ? "Yes"
                        : "No"}
                    </strong>
                  </div>

                </div>

                {/* DESCRIPTION */}

                <div className="admin-view-description">

                  <h3>
                    Description
                  </h3>

                  <p>
                    {selectedProperty.description ||
                      "No description available."}
                  </p>

                </div>

                {/* VIDEO */}

                {selectedProperty.video && (
                  <div className="admin-view-video">

                    <h3>
                      Property Video
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
                      Map Location
                    </h3>

                    <p>
                      {selectedProperty.map_location}
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
                    Edit Property
                  </button>

                  <button
                    type="button"
                    className="admin-view-close-btn"
                    onClick={
                      closeViewProperty
                    }
                  >
                    Close
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