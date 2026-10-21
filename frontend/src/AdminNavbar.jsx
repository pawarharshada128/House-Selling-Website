import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector, useLocale } from "./LocaleContext";

function AdminNavbar({
  activeMenu,
  buildRequestCount,
  setActiveMenu,
  onAddProperty,
  onAddProject,
}) {
  const navigate = useNavigate();
  const { t } = useLocale();

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
          alt={t("SK Constructions")}
        />

        <div className="admin-navbar-brand">
          <span>{t("SK Constructions")}</span>
          <small>{t("Admin Panel")}</small>
        </div>
      </div>

      {/* =================================================
          MOBILE MENU BUTTON
      ================================================= */}

      <button
        type="button"
        className="admin-mobile-menu-button"
        onClick={() => setMenuOpen((previous) => !previous)}
        aria-label={t("Toggle navigation menu")}
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
          {t("Home")}
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
          {t("Dashboard")}
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
          {t("Properties")}
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
          {t("User Enquiries")}
        </button>

        {/* BUILD ON YOUR LAND REQUESTS */}

        <button
          type="button"
          className={
            activeMenu === "build-requests"
              ? "admin-nav-active"
              : ""
          }
          onClick={() =>
            handleMenu("build-requests")
          }
        >
          {t("Build Requests")}
          {buildRequestCount > 0 && (
            <span className="admin-nav-count">
              {buildRequestCount}
            </span>
          )}
        </button>

        {/* ADD PROPERTY */}

        <button
          type="button"
          onClick={handleAddProperty}
        >
          {t("Add New Property")}
        </button>

        {/* NEW PROJECT */}

        <button
          type="button"
          onClick={handleAddProject}
        >
          {t("New Project")}
        </button>

        <LanguageSelector className="admin-language-selector" />

        {/* LOGOUT */}

        <button
          type="button"
          className="admin-logout-button"
          onClick={handleLogout}
        >
          {t("Logout")}
        </button>

      </nav>

    </header>
  );
}

export default AdminNavbar;