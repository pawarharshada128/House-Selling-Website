import "./App.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useLocale } from "./LocaleContext";
import { API_URL } from "./apiConfig";
function Contact() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLocale();

  const property = location.state?.property;

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const submissionPending = useRef(false);

  // =====================================================
  // SUBMIT ENQUIRY
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submissionPending.current) return;

    const token = localStorage.getItem("token");
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      console.error("Unable to read saved user:", error);
    }

    if (!token || user?.role !== "buyer") {
      if (user?.role === "admin") {
        setErrorMessage("Sign in with a customer account to submit an enquiry.");
      } else {
        navigate("/login", {
          state: {
            returnTo: "/contact",
            returnState: property ? { property } : undefined,
          },
        });
      }
      return;
    }

    submissionPending.current = true;
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    const form = e.target;

    const formData = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      message: form.message.value,

      propertyId: property?._id || null,

      propertyTitle:
        property?.title || "",
    };

    try {
      const response = await fetch(
        `${API_URL}/enquiries`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to send enquiry."
        );
      }

      setSuccessMessage(`Thank you. Your enquiry has been sent successfully. Reference ID: ${data.referenceId || data.enquiry?._id}`);

      form.reset();

    } catch (error) {
      console.error(
        "Enquiry error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Failed to send enquiry."
      );
    } finally {
      submissionPending.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">

      <section className="contact-section">

        <div className="contact-container">

          {/* =================================================
              CONTACT INFORMATION
          ================================================= */}

          <div className="contact-info">

            <span className="section-label">
              {t("GET IN TOUCH")}
            </span>

            <h2>
              {t("Contact Shree Krishna Constructions")}
            </h2>

            <p>
              {t("Have questions about a property, project or construction service? Our team is here to help you.")}
            </p>

            {/* SELECTED PROPERTY */}

            {property && (
              <div className="selected-property">

                <h3>
                  {t("Selected Property")}
                </h3>

                <p>
                  <strong>
                    {t("Property")}:
                  </strong>{" "}
                  {property.title}
                </p>

                <p>
                  <strong>
                    {t("Location")}:
                  </strong>{" "}
                  {property.location}
                </p>

                <p>
                  <strong>
                    {t("Price")}:
                  </strong>{" "}
                  ₹
                  {Number(
                    property.price || 0
                  ).toLocaleString("en-IN")}
                </p>

              </div>
            )}

            {/* ADDRESS */}

            <div className="contact-item">

              <span></span>

              <div>

                <h3>
                  {t("Address")}
                </h3>

                <p>
                  Shree Krishna Constructions,
                  <br />
                  Manmad, Maharashtra, India
                </p>

              </div>

            </div>

            {/* PHONE */}

            <div className="contact-item">

              <span></span>

              <div>

                <h3>
                  {t("Phone")}
                </h3>

                <p>
                  +91 98765 43210
                </p>

              </div>

            </div>

            {/* EMAIL */}

            <div className="contact-item">

              <span></span>

              <div>

                <h3>
                  {t("Email")}
                </h3>

                <p>
                  shree_krishna_constructions@gmail.com
                </p>

              </div>

            </div>

            {/* WORKING HOURS */}

            <div className="contact-item">

              <span></span>

              <div>

                <h3>
                  {t("Working Hours")}
                </h3>

                <p>
                  {t("Monday - Saturday")}
                </p>

                <p>
                  9:00 AM - 6:00 PM
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              ENQUIRY FORM
          ================================================= */}

          <div className="contact-form-container">

            <span className="section-label">
              {t("PROPERTY ENQUIRY")}
            </span>

            <h2>
              {t("Send Us a Message")}
            </h2>

            {/* SUCCESS */}

            {successMessage && (
              <div className="contact-success">
                {t(successMessage)}
              </div>
            )}

            {/* ERROR */}

            {errorMessage && (
              <div className="contact-error">
                {t(errorMessage)}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <input
                type="text"
                name="name"
                placeholder={t("Your Name")}
                required
              />

              <input
                type="email"
                name="email"
                placeholder={t("Your Email")}
                required
              />

              <input
                type="tel"
                name="phone"
                placeholder={t("Your Phone")}
                required
              />

              <textarea
                name="message"
                placeholder={
                  property
                    ? `${t("I am interested in")} ${property.title}. ${t("Please provide more information.")}`
                    : t("Tell us about the property or project you are interested in")
                }
                rows="6"
                required
              />

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading
                  ? t("Sending...")
                  : t("Send Enquiry")}
              </button>

            </form>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Contact;