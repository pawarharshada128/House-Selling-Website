import "./App.css";
import { useLocation } from "react-router-dom";
import { useState } from "react";

// const API_URL = "http://localhost:5000/api";
const API_URL = "https://house-selling-website.onrender.com/api";
// const SERVER_URL = "https://house-selling-website.onrender.com";
function Contact() {
  const location = useLocation();

  const property = location.state?.property;

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // SUBMIT ENQUIRY
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      setSuccessMessage(
        "Thank you. Your enquiry has been sent successfully."
      );

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
              GET IN TOUCH
            </span>

            <h2>
              Contact Shree Krishna Constructions
            </h2>

            <p>
              Have questions about a property,
              project or construction service?
              Our team is here to help you.
            </p>

            {/* SELECTED PROPERTY */}

            {property && (
              <div className="selected-property">

                <h3>
                  Selected Property
                </h3>

                <p>
                  <strong>
                    Property:
                  </strong>{" "}
                  {property.title}
                </p>

                <p>
                  <strong>
                    Location:
                  </strong>{" "}
                  {property.location}
                </p>

                <p>
                  <strong>
                    Price:
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
                  Address
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
                  Phone
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
                  Email
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
                  Working Hours
                </h3>

                <p>
                  Monday - Saturday
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
              PROPERTY ENQUIRY
            </span>

            <h2>
              Send Us a Message
            </h2>

            {/* SUCCESS */}

            {successMessage && (
              <div className="contact-success">
                {successMessage}
              </div>
            )}

            {/* ERROR */}

            {errorMessage && (
              <div className="contact-error">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <input
                type="text"
                name="name"
                placeholder="Your Name"
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Your Email"
                required
              />

              <input
                type="tel"
                name="phone"
                placeholder="Your Phone"
                required
              />

              <textarea
                name="message"
                placeholder={
                  property
                    ? `I am interested in ${property.title}. Please provide more information.`
                    : "Tell us about the property or project you are interested in"
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
                  ? "Sending..."
                  : "Send Enquiry"}
              </button>

            </form>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Contact;