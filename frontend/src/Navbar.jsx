
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Mobile menu state
  const [menuOpen, setMenuOpen] = useState(false);

  // Get login information safely
  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const isAdmin = Boolean(token) && user?.role === "admin";
  const isBuyer = Boolean(token) && user?.role === "buyer";

  // Close mobile menu
  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Navigate and scroll to a section after the home page renders
  const navigateToSection = (sectionId) => {
    closeMenu();

    if (location.pathname !== "/") {
      navigate("/", {
        state: { scrollTo: sectionId },
      });
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    closeMenu();
    navigate("/login", { replace: true });
  };

  // Properties
  const handleProperties = () => {
    navigateToSection("properties");
  };

  // Favorites
  const handleFavorites = () => {
    navigateToSection("wishlist");
  };

  // Logo navigation
  const handleLogoClick = () => {
    closeMenu();

    if (isAdmin) {
      navigate("/admin-dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <nav className="navbar">
      {/* LOGO */}
      <div
        className="navbar-logo"
        onClick={handleLogoClick}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            handleLogoClick();
          }
        }}
      >
        <img
          src="/logo.jpeg"
          alt="Shree Krishna Constructions Logo"
          className="navbar-logo-image"
        />

        <span>Shree Krishna Constructions</span>
      </div>

      {/* MOBILE MENU BUTTON */}
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setMenuOpen((previous) => !previous)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* NAVIGATION LINKS */}
      <div className={`navbar-links ${menuOpen ? "active" : ""}`}>
        {isAdmin ? (
          <>
            {/* ADMIN NAVIGATION */}
            <button
              type="button"
              className="admin-dashboard-button"
              onClick={() => {
                closeMenu();
                navigate("/admin-dashboard");
              }}
            >
              Admin Dashboard
            </button>
          </>
        ) : (
          <>
            {/* HOME */}
            <Link to="/" onClick={closeMenu}>
              Home
            </Link>

            {/* PROPERTIES */}
            <button
              type="button"
              className="properties-nav-button"
              onClick={handleProperties}
            >
              Properties
            </button>

            {/* CONTACT */}
            <Link to="/contact" onClick={closeMenu}>
              Contact
            </Link>

            {/* FAVORITES: BUYERS ONLY */}
            {isBuyer && (
              <button
                type="button"
                className="favorites-nav-button"
                onClick={handleFavorites}
              >
                Favorites
              </button>
            )}

            {/* LOGIN AND SIGNUP */}
            {!token && (
              <>
                <Link to="/login" onClick={closeMenu}>
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="signup-link"
                  onClick={closeMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </>
        )}

        {/* LOGGED-IN USER */}
        {token && (
          <>
            <span className="navbar-user">
              Hi, {user?.name || "User"}
            </span>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;