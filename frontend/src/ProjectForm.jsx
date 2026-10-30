import React, { useState } from "react";
import { useLocale } from "./LocaleContext";

const API_URL = "https://house-selling-website.onrender.com/api";
const BACKEND_URL = "https://house-selling-website.onrender.com";

const ProjectForm = () => {
  const { t } = useLocale();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Available",
    location: "",
  });

  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const selectedImage = e.target.files?.[0];

    if (!selectedImage) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(selectedImage.type)) {
      setMessage(t("Please select a JPG, PNG, or WEBP image."));
      e.target.value = "";
      return;
    }

    if (selectedImage.size > 4 * 1024 * 1024) {
      setMessage(t("Image size must be 4 MB or less."));
      e.target.value = "";
      return;
    }

    setImage(selectedImage);
    setImageUrl("");
    setMessage("");
  };

  const uploadImage = async () => {
    if (!image) return imageUrl;

    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error(t("Please log in as an admin before uploading an image."));
    }

    const data = new FormData();
    data.append("image", image);

    setUploading(true);

    try {
      const response = await fetch(`${API_URL}/database-images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t("Image upload failed."));
      }

      const uploadedUrl = result.image.startsWith("http")
        ? result.image
        : `${BACKEND_URL}${result.image}`;

      setImageUrl(uploadedUrl);
      return uploadedUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage(t("Please log in as an admin."));
      return;
    }

    setSaving(true);

    try {
      let uploadedImageUrl = imageUrl;

      if (image) {
        uploadedImageUrl = await uploadImage();
      }

      const projectData = {
        ...formData,
        ...(uploadedImageUrl && { image: uploadedImageUrl }),
      };

      const response = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t("Failed to save project."));
      }

      setMessage(t("Project saved successfully!"));

      setFormData({
        title: "",
        description: "",
        status: "Available",
        location: "",
      });

      setImage(null);
      setImageUrl("");

      e.target.reset();
    } catch (error) {
      setMessage(error.message || t("Something went wrong."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="project-form-container">
      <h2>{t("Add Project")}</h2>

      {message && <p>{t(message)}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">{t("Project Title")}</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="description">{t("Description")}</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="status">{t("Status")}</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="Available">{t("Available")}</option>
            <option value="Ongoing">{t("Ongoing")}</option>
            <option value="Completed">{t("Completed")}</option>
          </select>
        </div>

        <div>
          <label htmlFor="location">{t("Location")}</label>
          <input
            id="location"
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="image">{t("Project Image")}</label>
          <input
            id="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
          />
        </div>

        {image && (
          <div>
            <p>{t("Selected image:")} {image.name}</p>
            <img
              src={URL.createObjectURL(image)}
              alt={t("Selected project preview")}
              style={{
                width: "180px",
                height: "120px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          </div>
        )}

        {imageUrl && (
          <p>{t("Image uploaded successfully.")}</p>
        )}

        <button type="submit" disabled={saving || uploading}>
          {uploading
            ? t("Uploading Image...")
            : saving
            ? t("Saving Project...")
            : t("Save Project")}
        </button>
      </form>
    </div>
  );
};

export default ProjectForm;
