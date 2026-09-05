import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./App.css";

function Auth({ onLogin, initialMode = "login" }) {
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
      alert("Please enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
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
            "Login failed."
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

      if (location.state?.fromCart) {
        navigate("/contact", {
          state: {
            property: location.state.property,
            fromCart: true,
          },
        });
      } else {
        // Normal login
        navigate("/");
      }

    } catch (error) {
      console.error("Login error:", error);

      alert(
        "Cannot connect to backend. Make sure your backend is running on port 5000."
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
      alert("Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      alert(
        "Password must contain at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
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
            "Registration failed."
        );

        return;
      }

      alert(
        "Registration successful! Please login."
      );

      // Clear fields
      setName("");
      setEmail("");
      setPassword("");

      // Change to login
      setIsRegister(false);

      // Keep the cart information when going to login
      if (location.state?.fromCart) {
        navigate("/login", {
          state: {
            fromCart: true,
            property: location.state.property,
          },
        });
      } else {
        navigate("/login");
      }

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      alert(
        "Cannot connect to backend. Make sure your backend is running on port 5000."
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
      "Please contact Shree Krishna Constructions support to reset your password."
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
           Shree Krishna Constructions
          </h1>

          <div className="brand-line"></div>

          <h2>
            Find a place you will love
            to call home.
          </h2>

          <p>
            Discover verified properties, explore
            beautiful homes, and find the perfect
            place for you and your family.
          </p>

          <div className="brand-features">

            <div className="brand-feature">
              <span>01</span>

              <div>
                <strong>
                  Verified Properties
                </strong>

                <p>
                  Explore quality homes and
                  properties.
                </p>
              </div>
            </div>

            <div className="brand-feature">
              <span>02</span>

              <div>
                <strong>
                  Easy Property Search
                </strong>

                <p>
                  Find properties based on your
                  requirements.
                </p>
              </div>
            </div>

            <div className="brand-feature">
              <span>03</span>

              <div>
                <strong>
                  Trusted Platform
                </strong>

                <p>
                  A simple and reliable way to
                  find your next home.
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
                ? "Create your account"
                : "Welcome back"}
            </h2>

            <p>
              {isRegister
                ? "Register to start finding your dream home."
                : "Sign in to continue to HomeFinder."}
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
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
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
                Email Address
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
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
                Password
              </label>

              <div className="password-wrapper">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
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
                    ? "Hide"
                    : "Show"}
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
                    Remember me
                  </span>

                </label>

                <button
                  type="button"
                  className="forgot-button"
                  onClick={
                    handleForgotPassword
                  }
                >
                  Forgot password?
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
                ? "Please wait..."
                : isRegister
                ? "Create Account"
                : "Sign In"}
            </button>

          </form>

          {/* SWITCH */}

          <div className="auth-switch">

            <span>
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}
            </span>

            <button
              type="button"
              onClick={switchMode}
            >
              {isRegister
                ? "Sign In"
                : "Create Account"}
            </button>

          </div>

          {/* FOOTER */}

          <div className="auth-footer">

            <p>
              By continuing, you agree to our
            </p>

            <div>

              <button type="button">
                Terms of Service
              </button>

              <span>and</span>

              <button type="button">
                Privacy Policy
              </button>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Auth;