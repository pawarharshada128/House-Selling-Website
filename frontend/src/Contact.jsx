import "./App.css";
import { useLocation } from "react-router-dom";

function Contact() {
  const location = useLocation();

  const property = location.state?.property;

  const handleSubmit = (e) => {
    e.preventDefault();

    alert(
      "Thank you! Your enquiry has been sent successfully."
    );

    e.target.reset();
  };

  return (
    <div className="contact-page">

      <section className="contact-section">

        <div className="contact-container">

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
                  🏠 Selected Property
                </h3>

                <p>
                  <strong>Property:</strong>{" "}
                  {property.title}
                </p>

                <p>
                  <strong>Location:</strong>{" "}
                  {property.location}
                </p>

                <p>
                  <strong>Price:</strong>{" "}
                  ₹{property.price}
                </p>

              </div>
            )}

            <div className="contact-item">
              <span></span>

              <div>
                <h3>Address</h3>

                <p>
                  Shree Krishna Constructions,
                  <br />
                 Manmad, Maharashtra, India
                </p>
              </div>
            </div>

            <div className="contact-item">
              <span></span>

              <div>
                <h3>Phone</h3>

                <p>
                  +91 98765 43210
                </p>
              </div>
            </div>

            <div className="contact-item">
              <span></span>

              <div>
                <h3>Email</h3>

                <p>
                  shree_krishna_constructions@gmail.com
                </p>
              </div>
            </div>

            <div className="contact-item">
              <span></span>

              <div>
                <h3>Working Hours</h3>

                <p>
                  Monday - Saturday
                </p>

                <p>
                  9:00 AM - 6:00 PM
                </p>
              </div>
            </div>

          </div>

          <div className="contact-form-container">

            <span className="section-label">
              PROPERTY ENQUIRY
            </span>

            <h2>
              Send Us a Message
            </h2>

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
              >
                Send Enquiry
              </button>

            </form>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Contact;