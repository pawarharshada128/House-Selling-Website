import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        <div className="footer-column">

          <h2>Shree Krishna Constructions</h2>

          <p>
            Find your dream home easily
            with us.
          </p>

        </div>

        <div className="footer-column">

          <h3>Quick Links</h3>

          <Link to="/">
            Home
          </Link>

          <Link to="/contact">
            Contact
          </Link>

          <Link to="/login">
            Login
          </Link>

          <Link to="/signup">
            Sign Up
          </Link>

        </div>

        <div className="footer-column">

          <h3>Contact</h3>

          <p> shreekrishna_constructions@gmail.com</p>

          <p>📞 +91 98765 43210</p>

          <p>📍 Maharashtra, India</p>

        </div>

      </div>

      <div className="footer-bottom">

        © 2026 HomeFinder. All Rights Reserved.

      </div>

    </footer>
  );
}

export default Footer;