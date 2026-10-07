import React from "react";
import { useNavigate } from "react-router-dom";

function AdminNavbar({
  activeMenu,
  setActiveMenu,
  onAddProperty,
  onAddProject,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <header className="admin-navbar">

      <div
        className="admin-navbar-logo"
        onClick={() => navigate("/")}
      >
        <img
          src="/logo.jpeg"
          alt="SK Constructions"
        />

        <span>
          SK Constructions
        </span>
      </div>

      <nav className="admin-navbar-links">

        <button onClick={() => navigate("/")}>
          Home
        </button>

        <button
          className={
            activeMenu === "dashboard"
              ? "admin-nav-active"
              : ""
          }
          onClick={() => setActiveMenu("dashboard")}
        >
          Dashboard
        </button>

        <button
          className={
            activeMenu === "properties"
              ? "admin-nav-active"
              : ""
          }
          onClick={() => setActiveMenu("properties")}
        >
          Properties
        </button>

        <button onClick={onAddProperty}>
          Add New Property
        </button>

        <button onClick={onAddProject}>
          New Project
        </button>

        <button
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