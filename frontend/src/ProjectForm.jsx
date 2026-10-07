import React, {
  useState,
} from "react";

// const API_URL =
//   "http://localhost:5000/api";
const API_URL = "https://house-selling-website.onrender.com/api";
// const SERVER_URL = "https://house-selling-website.onrender.com";

function ProjectForm({
  onClose,
  onSuccess,
}) {
  const [formData, setFormData] =
    useState({
      title: "",
      description: "",
      status: "Ongoing",
      location: "",
    });

  const [loading, setLoading] =
    useState(false);

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) {
      alert(
        "Please login first."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          `${API_URL}/projects`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify(
              formData
            ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to add project."
        );
      }

      alert(
        "Project added successfully."
      );

      onSuccess?.();
      onClose();

    } catch (error) {
      console.error(
        "Project error:",
        error
      );

      alert(
        error.message ||
          "Failed to add project."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="admin-modal-overlay"
      onClick={onClose}
    >

      <div
        className="admin-modal project-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="admin-modal-header">

          <div>
            <span className="admin-modal-label">
              PROJECT MANAGEMENT
            </span>

            <h2>
              Add New Project
            </h2>
          </div>

          <button
            className="modal-close-button"
            onClick={onClose}
          >
            ✕
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="admin-property-form"
        >

          <div className="admin-form-grid">

            <div className="admin-form-group full">
              <label>
                Project Title
              </label>

              <input
                type="text"
                name="title"
                placeholder="Enter project title"
                value={
                  formData.title
                }
                onChange={
                  handleChange
                }
                required
              />
            </div>

            <div className="admin-form-group">
              <label>
                Status
              </label>

              <select
                name="status"
                value={
                  formData.status
                }
                onChange={
                  handleChange
                }
              >
                <option value="Ongoing">
                  Ongoing
                </option>

                <option value="Completed">
                  Completed
                </option>

                <option value="Upcoming">
                  Upcoming
                </option>
              </select>
            </div>

            <div className="admin-form-group">
              <label>
                Location
              </label>

              <input
                type="text"
                name="location"
                placeholder="Project location"
                value={
                  formData.location
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="admin-form-group full">
              <label>
                Project Description
              </label>

              <textarea
                name="description"
                rows="6"
                placeholder="Enter project description"
                value={
                  formData.description
                }
                onChange={
                  handleChange
                }
                required
              />
            </div>

          </div>

          <div className="admin-modal-actions">

            <button
              type="button"
              className="admin-secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : "Add Project"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default ProjectForm;