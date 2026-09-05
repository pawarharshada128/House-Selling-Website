import React from "react";
import { Routes, Route } from "react-router-dom";

import App from "./App";
import Auth from "./Auth";
import Contact from "./Contact";
import PropertyDetails from "./PropertyDetails";
import Payment from "./Payment";

import Navbar from "./Navbar";
import Footer from "./Footer";

function RouterApp() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<App />} />

        <Route path="/login" element={<Auth />} />

        <Route path="/signup" element={<Auth />} />

        <Route path="/contact" element={<Contact />} />

        <Route
          path="/property/:id"
          element={<PropertyDetails />}
        />

        <Route
          path="/payment"
          element={<Payment />}
        />
      </Routes>

      <Footer />
    </>
  );
}

export default RouterApp;