import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  // Mobile menu state
  const [menuOpen, setMenuOpen] = useState(false);

  const token = localStorage.getItem("token");

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const isAdmin =
    token && user?.role === "admin";

  const isBuyer =
    token && user?.role === "buyer";

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setMenuOpen(false);

    navigate("/login");
  };

  // Properties
  const handleProperties = () => {
    setMenuOpen(false);

    navigate("/");

    setTimeout(() => {
      document
        .getElementById("properties")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  };

  // Favorites
  const handleFavorites = () => {
    setMenuOpen(false);

    navigate("/");

    setTimeout(() => {
      document
        .getElementById("wishlist")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 300);
  };

  return (
    <nav className="navbar">

      {/* LOGO */}
      <div
        className="navbar-logo"
        onClick={() => {
          setMenuOpen(false);

          navigate(
            isAdmin
              ? "/admin-dashboard"
              : "/"
          );
        }}
      >
        <img
          src="/logo.jpeg"
          alt="Shree Krishna Constructions Logo"
          className="navbar-logo-image"
        />

        <span>
          Shree Krishna Constructions
        </span>
      </div>


      {/* MOBILE 3-LINE MENU BUTTON */}
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>


      {/* NAVIGATION */}
      <div
        className={`navbar-links ${
          menuOpen ? "active" : ""
        }`}
      >

        {/* =========================
            ADMIN NAVIGATION
        ========================== */}

        {isAdmin ? (
          <>
            <button
              type="button"
              className="admin-dashboard-button"
              onClick={() => {
                setMenuOpen(false);
                navigate("/admin-dashboard");
              }}
            >
              Admin Dashboard
            </button>
          </>
        ) : (
          <>
            {/* HOME */}
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
            >
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
            <Link
              to="/contact"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </Link>


            {/* FAVORITES - BUYER ONLY */}
            {isBuyer && (
              <button
                type="button"
                className="favorites-nav-button"
                onClick={handleFavorites}
              >
                Favorites
              </button>
            )}


            {/* LOGIN / SIGNUP */}
            {!token && (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="signup-link"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </>
        )}


        {/* =========================
            LOGGED-IN USER
        ========================== */}

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


