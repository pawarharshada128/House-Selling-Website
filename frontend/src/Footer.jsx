import React from "react";
import { Link } from "react-router-dom";
import { useLocale } from "./LocaleContext";

function Footer() {
  const { t } = useLocale();
  return (
    <footer className="footer">

      <div className="footer-container">

        <div className="footer-column">

          <h2>{t("Shree Krishna Constructions")}</h2>

          <p>
            {t("Find your dream home easily with us.")}
          </p>

        </div>

        <div className="footer-column">

          <h3>{t("Quick Links")}</h3>

          <Link to="/">
            {t("Home")}
          </Link>

          <Link to="/contact">
            {t("Contact")}
          </Link>

          <Link to="/login">
            {t("Login")}
          </Link>

          <Link to="/signup">
            {t("Sign Up")}
          </Link>

        </div>

        <div className="footer-column">

          <h3>{t("Contact")}</h3>

          <p> shreekrishna_constructions@gmail.com</p>

          <p>📞 +91 98765 43210</p>

          <p>📍 Maharashtra, India</p>

        </div>

      </div>

      <div className="footer-bottom">

        © 2026 {t("HomeFinder")}. {t("All Rights Reserved.")}

      </div>

    </footer>
  );
}

export default Footer;