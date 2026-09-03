import "./App.css";

function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();

    alert(
      "Thank you! Your message has been sent successfully."
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
              Contact HomeFinder
            </h2>

            <p>
              Have questions about a property,
              project or construction service?
              Our team is here to help you.
            </p>

            <div className="contact-item">

              <span></span>

              <div>
                <h3>Address</h3>

                <p>
                  HomeFinder Office,
                  <br />
                  Kopargaon, Maharashtra, India
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
                  homefinder@gmail.com
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
                placeholder="Tell us about the property or project you are interested in"
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