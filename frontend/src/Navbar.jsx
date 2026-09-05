import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="navbar">

      {/* LOGO */}
      <div
        className="navbar-logo"
        onClick={() => navigate("/")}
      >
        <img
          src="/logo.jpeg"
          alt="Shree Krishna Constructions Logo"
          className="navbar-logo-image"
        />

        <span>Shree Krishna Constructions</span>
      </div>

      {/* NAVIGATION */}
      <div className="navbar-links">

        <Link to="/">
          Home
        </Link>

       <button
  className="properties-nav-button"
  onClick={() => {
    navigate("/");

    setTimeout(() => {
      document
        .getElementById("properties")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 100);
  }}
>
  Properties
</button>

        <Link to="/contact">
          Contact
        </Link>

        {/* FAVORITES - BUYER ONLY */}
        {token && user?.role === "buyer" && (
          <button
            className="favorites-nav-button"
            onClick={() => {
              navigate("/#wishlist");

              setTimeout(() => {
                document
                  .getElementById("wishlist")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  });
              }, 300);
            }}
          >
            ♥ Favorites
          </button>
        )}

        {/* LOGIN / SIGNUP */}
        {!token ? (
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
        ) : (
          <>
            <span className="navbar-user">
              Hi, {user?.name || "User"}
            </span>

            <button
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