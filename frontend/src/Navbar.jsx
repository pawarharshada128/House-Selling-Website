import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

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

    navigate("/login");
  };

  // Properties
  const handleProperties = () => {
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
        onClick={() =>
          navigate(
            isAdmin
              ? "/admin-dashboard"
              : "/"
          )
        }
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

      {/* NAVIGATION */}
      <div className="navbar-links">

        {/* =========================
            ADMIN NAVIGATION
        ========================== */}

        {isAdmin ? (
          <>
            <button
              type="button"
              className="admin-dashboard-button"
              onClick={() =>
                navigate("/admin-dashboard")
              }
            >
              Admin Dashboard
            </button>
          </>
        ) : (
          <>
            {/* =========================
                PUBLIC NAVIGATION
            ========================== */}

            {/* HOME */}
            <Link to="/">
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
            <Link to="/contact">
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
                <Link to="/login">
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="signup-link"
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