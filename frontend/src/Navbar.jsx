
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LanguageSelector, useLocale } from "./LocaleContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLocale();
  const navbarRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Mobile menu state
  const [menuState, setMenuState] = useState(() => ({
    open: false,
    path: location.pathname,
  }));
  const menuOpen =
    menuState.open && menuState.path === location.pathname;
  const [activeSection, setActiveSection] = useState(
    location.pathname === "/" ? "home" : ""
  );

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
    setMenuState({ open: false, path: location.pathname });
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setMenuState((current) => ({ ...current, open: false }));
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (menuOpen) menuButtonRef.current?.focus();
        setMenuState((current) => ({ ...current, open: false }));
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (location.pathname !== "/") return undefined;
    const sectionIds = ["home", "properties", "wishlist", "build-on-your-land", "reviews"];
    const sectionStates = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          sectionStates.set(entry.target.id, {
            intersecting: entry.isIntersecting,
            top: entry.boundingClientRect.top,
          });
        });
        const marker = window.innerHeight * 0.3;
        const current = [...sectionStates.entries()]
          .filter(([, state]) => state.intersecting)
          .sort(
            ([leftId], [rightId]) =>
              Math.abs(
                (document.getElementById(leftId)?.getBoundingClientRect().top || 0) -
                  marker
              ) -
              Math.abs(
                (document.getElementById(rightId)?.getBoundingClientRect().top || 0) -
                  marker
              )
          )[0];
        if (current) setActiveSection(current[0]);
      },
      { rootMargin: "-25% 0px -65% 0px" }
    );
    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => {
      observer.disconnect();
    };
  }, [location.pathname]);

  // Navigate and scroll to a section after the home page renders
  const navigateToSection = (sectionId) => {
    closeMenu();

    if (location.pathname !== "/") {
      navigate("/", {
        state: { scrollTo: sectionId },
      });
      return;
    }

    const section = document.getElementById(sectionId);
    if (section) {
      const navHeight = navbarRef.current?.getBoundingClientRect().height || 0;
      const top =
        window.scrollY +
        section.getBoundingClientRect().top -
        navHeight -
        8;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
      setActiveSection(sectionId);
    }
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
    <nav
      className={`navbar ${isAdmin ? "navbar--admin" : isBuyer ? "navbar--buyer" : "navbar--guest"} ${menuOpen ? "navbar-menu-open" : ""}`}
      ref={navbarRef}
    >
      {/* LOGO */}
      <div
        className="navbar-logo"
        onClick={handleLogoClick}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleLogoClick();
          }
        }}
        aria-label={t("Go to home")}
        title={t("Go to home")}
      >
        <img
          src="/logo.jpeg"
          alt={t("Shree Krishna Constructions Logo")}
          className="navbar-logo-image"
        />

        <span>{t("Shree Krishna Builders")}</span>
      </div>

      {/* MOBILE MENU BUTTON */}
      <button
        type="button"
        className="mobile-menu-button"
        ref={menuButtonRef}
        onClick={() =>
          setMenuState((previous) => ({
            open: !(previous.open && previous.path === location.pathname),
            path: location.pathname,
          }))
        }
        aria-label={menuOpen ? t("Close navigation menu") : t("Open navigation menu")}
        aria-controls="primary-navigation"
        aria-expanded={menuOpen}
      >
        <span className={menuOpen ? "menu-line menu-line-top open" : "menu-line menu-line-top"}></span>
        <span className={menuOpen ? "menu-line menu-line-middle open" : "menu-line menu-line-middle"}></span>
        <span className={menuOpen ? "menu-line menu-line-bottom open" : "menu-line menu-line-bottom"}></span>
      </button>

      {/* NAVIGATION LINKS */}
      <div
        className={`navbar-links ${menuOpen ? "active" : ""}`}
        id="primary-navigation"
      >
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
              aria-current={location.pathname === "/admin-dashboard" ? "page" : undefined}
            >
              {t("Admin Dashboard")}
            </button>
          </>
        ) : (
          <>
            {/* HOME */}
            <Link
              to="/"
              onClick={closeMenu}
              className={location.pathname === "/" && activeSection === "home" ? "nav-current" : ""}
              aria-current={location.pathname === "/" && activeSection === "home" ? "page" : undefined}
            >
              {t("Home")}
            </Link>

            {/* PROPERTIES */}
            <button
              type="button"
              className={`properties-nav-button ${location.pathname === "/" && activeSection === "properties" ? "nav-current" : ""}`}
              onClick={handleProperties}
              aria-current={location.pathname === "/" && activeSection === "properties" ? "location" : undefined}
            >
              {t("Properties")}
            </button>

            <button
              type="button"
              className={`build-land-nav-button ${location.pathname === "/" && activeSection === "build-on-your-land" ? "nav-current" : ""}`}
              onClick={() => navigateToSection("build-on-your-land")}
              aria-current={location.pathname === "/" && activeSection === "build-on-your-land" ? "location" : undefined}
            >
              {t("Build on Your Land")}
            </button>

            <button
              type="button"
              className={`build-land-nav-button ${location.pathname === "/" && activeSection === "reviews" ? "nav-current" : ""}`}
              onClick={() => navigateToSection("reviews")}
              aria-current={location.pathname === "/" && activeSection === "reviews" ? "location" : undefined}
            >
              {t("Reviews")}
            </button>

            {/* CONTACT */}
            <Link
              to="/contact"
              onClick={closeMenu}
              className={location.pathname === "/contact" ? "nav-current" : ""}
              aria-current={location.pathname === "/contact" ? "page" : undefined}
            >
              {t("Contact")}
            </Link>

            {/* FAVORITES: BUYERS ONLY */}
            {isBuyer && (
              <>
                <Link
                  to="/my-enquiries"
                  onClick={closeMenu}
                  className={location.pathname === "/my-enquiries" ? "nav-current" : ""}
                  aria-current={location.pathname === "/my-enquiries" ? "page" : undefined}
                >
                  {t("My Enquiries")}
                </Link>
                <button
                  type="button"
                  className={`favorites-nav-button ${location.pathname === "/" && activeSection === "wishlist" ? "nav-current" : ""}`}
                  onClick={handleFavorites}
                  aria-current={location.pathname === "/" && activeSection === "wishlist" ? "location" : undefined}
                >
                  {t("Favorites")}
                </button>
              </>
            )}

            {/* LOGIN AND SIGNUP */}
            {!token && (
              <>
                <Link to="/login" onClick={closeMenu} className={location.pathname === "/login" ? "nav-current" : ""}>
                  {t("Login")}
                </Link>

                <Link
                  to="/signup"
                  className={`signup-link ${location.pathname === "/signup" ? "nav-current" : ""}`}
                  onClick={closeMenu}
                  aria-current={location.pathname === "/signup" ? "page" : undefined}
                >
                  {t("Sign Up")}
                </Link>
              </>
            )}
          </>
        )}

        <LanguageSelector className="navbar-language-selector" />

        {/* LOGGED-IN USER */}
        {token && (
          <>
            <span className="navbar-user">
              {t("Hi")}, {user?.name || t("User")}
            </span>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
              aria-label={t("Log out of your account")}
            >
              {t("Logout")}
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;