import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminNavbar({
  activeMenu,
  setActiveMenu,
  onAddProperty,
  onAddProject,
}) {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  // =====================================================
  // CLOSE MOBILE MENU
  // =====================================================

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    closeMenu();

    navigate("/login", {
      replace: true,
    });
  };

  // =====================================================
  // HOME
  // =====================================================

  const handleHome = () => {
    setActiveMenu("home");
    navigate("/");
    closeMenu();
  };

  // =====================================================
  // MENU
  // =====================================================

  const handleMenu = (menu) => {
    setActiveMenu(menu);
    closeMenu();
  };

  // =====================================================
  // ADD PROPERTY
  // =====================================================

  const handleAddProperty = () => {
    onAddProperty();
    closeMenu();
  };

  // =====================================================
  // ADD PROJECT
  // =====================================================

  const handleAddProject = () => {
    onAddProject();
    closeMenu();
  };

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <header className="admin-navbar">

      {/* =================================================
          LOGO
      ================================================= */}

      <div
        className="admin-navbar-logo"
        onClick={handleHome}
      >
        <img
          src="/logo.jpeg"
          alt="SK Constructions"
        />

        <div className="admin-navbar-brand">
          <span>SK Constructions</span>
          <small>Admin Panel</small>
        </div>
      </div>

      {/* =================================================
          MOBILE MENU BUTTON
      ================================================= */}

      <button
        type="button"
        className="admin-mobile-menu-button"
        onClick={() => setMenuOpen((previous) => !previous)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav
        className={`admin-navbar-links ${
          menuOpen
            ? "admin-navbar-links-open"
            : ""
        }`}
      >

        {/* HOME */}

        <button
          type="button"
          className={
            activeMenu === "home"
              ? "admin-nav-active"
              : ""
          }
          onClick={handleHome}
        >
          Home
        </button>

        {/* DASHBOARD */}

        <button
          type="button"
          className={
            activeMenu === "dashboard"
              ? "admin-nav-active"
              : ""
          }
          onClick={() =>
            handleMenu("dashboard")
          }
        >
          Dashboard
        </button>

        {/* PROPERTIES */}

        <button
          type="button"
          className={
            activeMenu === "properties"
              ? "admin-nav-active"
              : ""
          }
          onClick={() =>
            handleMenu("properties")
          }
        >
          Properties
        </button>

        {/* USER ENQUIRIES */}

        <button
          type="button"
          className={
            activeMenu === "enquiries"
              ? "admin-nav-active"
              : ""
          }
          onClick={() =>
            handleMenu("enquiries")
          }
        >
          User Enquiries
        </button>

        {/* ADD PROPERTY */}

        <button
          type="button"
          onClick={handleAddProperty}
        >
          Add New Property
        </button>

        {/* NEW PROJECT */}

        <button
          type="button"
          onClick={handleAddProject}
        >
          New Project
        </button>

        {/* LOGOUT */}

        <button
          type="button"
          className="admin-logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </nav>

    </header>
  );
}

export default AdminNavbar;