import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import { useLocale } from "./LocaleContext";

function Auth({ onLogin, initialMode = "login" }) {
  const { t } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(
    location.pathname === "/signup" || initialMode === "register"
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert(t("Please enter email and password."));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://house-selling-website.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      console.log("Login response:", data);

      if (!response.ok) {
        alert(
          data.message ||
            data.error ||
            t("Login failed.")
        );
        return;
      }

      // Save token
      localStorage.setItem("token", data.token);

      // Save user
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // Remember email
      if (rememberMe) {
        localStorage.setItem(
          "rememberedEmail",
          email.trim()
        );
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Send user to parent if required
      if (onLogin) {
        onLogin(data.user);
      }

      // =================================================
      // IMPORTANT:
      // If login came from Add to Cart,
      // go to Contact page.
      // =================================================

      if (data.user.role === "admin") {
        navigate("/admin-dashboard", {
          replace: true,
        });
      } else if (location.state?.fromCart) {
        navigate("/contact", {
          state: {
            property: location.state.property,
            fromCart: true,
          },
        });
      } else if (location.state?.returnTo) {
        const requestedReturnTo = location.state.returnTo;
        const returnTo =
          typeof requestedReturnTo === "string" &&
          requestedReturnTo.startsWith("/") &&
          !requestedReturnTo.startsWith("//")
            ? requestedReturnTo
            : "/";
        navigate(returnTo, {
          replace: true,
          state: location.state.returnState,
        });
      } else {
        // Normal login
        navigate("/");
      }

    } catch (error) {
      console.error("Login error:", error);

      alert(
        t("Cannot connect to backend. Make sure your backend is running on port 5000.")
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      alert(t("Please fill all fields."));
      return;
    }

    if (password.length < 6) {
      alert(
        t("Password must contain at least 6 characters.")
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://house-selling-website.onrender.com/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      console.log("Register response:", data);

      if (!response.ok) {
        alert(
          data.message ||
            data.error ||
            t("Registration failed.")
        );

        return;
      }

      alert(
        t("Registration successful! Please login.")
      );

      // Clear fields
      setName("");
      setEmail("");
      setPassword("");

      // Change to login
      setIsRegister(false);

      navigate("/login", { state: location.state });

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      alert(
        t("Cannot connect to backend. Make sure your backend is running on port 5000.")
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // SWITCH LOGIN / REGISTER
  // =====================================================

  const switchMode = () => {
    const newMode = !isRegister;

    setIsRegister(newMode);

    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);

    if (newMode) {
      navigate("/signup", {
        state: location.state,
      });
    } else {
      navigate("/login", {
        state: location.state,
      });
    }
  };

  // =====================================================
  // FORGOT PASSWORD
  // =====================================================

  const handleForgotPassword = () => {
    alert(
      t("Please contact Shree Krishna Constructions support to reset your password.")
    );
  };

  // =====================================================
  // REMEMBERED EMAIL
  // =====================================================

  const rememberedEmail =
    localStorage.getItem("rememberedEmail");

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="auth-page">

      {/* LEFT BRAND SECTION */}

      <section className="auth-brand">

        <div className="brand-content">

          <div className="brand-logo">
            SK
          </div>

          <h1>
           {t("Shree Krishna Constructions")}
          </h1>

          <div className="brand-line"></div>

          <h2>
            {t("Find a place you will love to call home.")}
          </h2>

          <p>
            {t("Discover verified properties, explore beautiful homes, and find the perfect place for you and your family.")}
          </p>

          <div className="brand-features">

            <div className="brand-feature">
              <span>01</span>

              <div>
                <strong>
                  {t("Verified Properties")}
                </strong>

                <p>
                  {t("Explore quality homes and properties.")}
                </p>
              </div>
            </div>

            <div className="brand-feature">
              <span>02</span>

              <div>
                <strong>
                  {t("Easy Property Search")}
                </strong>

                <p>
                  {t("Find properties based on your requirements.")}
                </p>
              </div>
            </div>

            <div className="brand-feature">
              <span>03</span>

              <div>
                <strong>
                  {t("Trusted Platform")}
                </strong>

                <p>
                  {t("A simple and reliable way to find your next home.")}
                </p>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* RIGHT AUTH SECTION */}

      <section className="auth-section">

        <div className="auth-card">

          <div className="auth-header">

            <div className="mobile-logo">
              SK
            </div>

            <h2>
              {isRegister
                ? t("Create your account")
                : t("Welcome back")}
            </h2>

            <p>
              {isRegister
                ? t("Register to start finding your dream home.")
                : t("Sign in to continue to HomeFinder.")}
            </p>

          </div>

          <form
            className="auth-form"
            onSubmit={
              isRegister
                ? handleRegister
                : handleLogin
            }
          >

            {/* NAME */}

            {isRegister && (
              <div className="form-group">

                <label htmlFor="name">
                  {t("Full Name")}
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder={t("Enter your full name")}
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  autoComplete="name"
                  required
                />

              </div>
            )}

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="email">
                {t("Email Address")}
              </label>

              <input
                id="email"
                type="email"
                placeholder={t("Enter your email")}
                value={
                  email ||
                  (!isRegister
                    ? rememberedEmail || ""
                    : "")
                }
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
                required
              />

            </div>

            {/* PASSWORD */}

            <div className="form-group">

              <label htmlFor="password">
                {t("Password")}
              </label>

              <div className="password-wrapper">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder={t("Enter your password")}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete={
                    isRegister
                      ? "new-password"
                      : "current-password"
                  }
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                >
                  {showPassword
                    ? t("Hide")
                    : t("Show")}
                </button>

              </div>

            </div>

            {/* LOGIN OPTIONS */}

            {!isRegister && (
              <div className="login-options">

                <label className="remember-option">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    {t("Remember me")}
                  </span>

                </label>

                <button
                  type="button"
                  className="forgot-button"
                  onClick={
                    handleForgotPassword
                  }
                >
                  {t("Forgot password?")}
                </button>

              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? t("Please wait...")
                : isRegister
                ? t("Create Account")
                : t("Sign In")}
            </button>

          </form>

          {/* SWITCH */}

          <div className="auth-switch">

            <span>
              {isRegister
                ? t("Already have an account?")
                : t("Don't have an account?")}
            </span>

            <button
              type="button"
              onClick={switchMode}
            >
              {isRegister
                ? t("Sign In")
                : t("Create Account")}
            </button>

          </div>

          {/* FOOTER */}

          <div className="auth-footer">

            <p>
              {t("By continuing, you agree to our")}
            </p>

            <div>

              <button type="button">
                {t("Terms of Service")}
              </button>

              <span>{t("and")}</span>

              <button type="button">
                {t("Privacy Policy")}
              </button>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Auth;