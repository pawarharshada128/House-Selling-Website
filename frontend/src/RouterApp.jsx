import React from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import App from "./App";
import Auth from "./Auth";
import Contact from "./Contact";
import PropertyDetails from "./PropertyDetails";
import Payment from "./Payment";
import AdminDashboard from "./AdminDashboard";

import Navbar from "./Navbar";
import Footer from "./Footer";

function RouterApp() {
  const location = useLocation();

  // =====================================================
  // GET LOGIN USER
  // =====================================================

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

  const isAdmin =
    Boolean(token) &&
    user?.role === "admin";

  // =====================================================
  // ADMIN ROUTES
  // =====================================================

  if (isAdmin) {
    return (
      <Routes>

        {/* ==========================================
            ADMIN DASHBOARD
        =========================================== */}

        <Route
          path="/admin-dashboard"
          element={
            <AdminDashboard />
          }
        />

        {/* ==========================================
            ADMIN HOME
            Do NOT show public App.jsx
        =========================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/admin-dashboard"
              replace
            />
          }
        />

        {/* ==========================================
            BLOCK CONTACT
        =========================================== */}

        <Route
          path="/contact"
          element={
            <Navigate
              to="/admin-dashboard"
              replace
            />
          }
        />

        {/* ==========================================
            BLOCK PROPERTY DETAILS
        =========================================== */}

        <Route
          path="/property/:id"
          element={
            <Navigate
              to="/admin-dashboard"
              replace
            />
          }
        />

        {/* ==========================================
            BLOCK PAYMENT
        =========================================== */}

        <Route
          path="/payment"
          element={
            <Navigate
              to="/admin-dashboard"
              replace
            />
          }
        />

        {/* ==========================================
            BLOCK LOGIN FOR ALREADY LOGGED ADMIN
        =========================================== */}

        <Route
          path="/login"
          element={
            <Navigate
              to="/admin-dashboard"
              replace
            />
          }
        />

        {/* ==========================================
            BLOCK SIGNUP
        =========================================== */}

        <Route
          path="/signup"
          element={
            <Navigate
              to="/admin-dashboard"
              replace
            />
          }
        />

        {/* ==========================================
            ANY UNKNOWN ADMIN URL
        =========================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/admin-dashboard"
              replace
            />
          }
        />

      </Routes>
    );
  }

  // =====================================================
  // PUBLIC WEBSITE
  // =====================================================

  return (
    <>
      {/* PUBLIC NAVBAR */}

      <Navbar />

      <Routes>

        {/* ==========================================
            HOME
        =========================================== */}

        <Route
          path="/"
          element={
            <App />
          }
        />

        {/* ==========================================
            LOGIN
        =========================================== */}

        <Route
          path="/login"
          element={
            <Auth />
          }
        />

        {/* ==========================================
            SIGN UP
        =========================================== */}

        <Route
          path="/signup"
          element={
            <Auth />
          }
        />

        {/* ==========================================
            CONTACT
        =========================================== */}

        <Route
          path="/contact"
          element={
            <Contact />
          }
        />

        {/* ==========================================
            PROPERTY DETAILS
        =========================================== */}

        <Route
          path="/property/:id"
          element={
            <PropertyDetails />
          }
        />

        {/* ==========================================
            PAYMENT
        =========================================== */}

        <Route
          path="/payment"
          element={
            <Payment />
          }
        />

        {/* ==========================================
            ADMIN DASHBOARD
        =========================================== */}

        <Route
          path="/admin-dashboard"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        {/* ==========================================
            UNKNOWN PAGE
        =========================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

      {/* PUBLIC FOOTER ONLY */}

      <Footer />
    </>
  );
}

export default RouterApp;