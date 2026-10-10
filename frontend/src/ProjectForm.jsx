import React, { useState } from "react";

const API_URL = "https://house-selling-website.onrender.com/api";
const BACKEND_URL = "https://house-selling-website.onrender.com";

const ProjectForm = () => {
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
      setMessage("Please select a JPG, PNG, or WEBP image.");
      e.target.value = "";
      return;
    }

    if (selectedImage.size > 4 * 1024 * 1024) {
      setMessage("Image size must be 4 MB or less.");
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
      throw new Error("Please log in as an admin before uploading an image.");
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
        throw new Error(result.message || "Image upload failed.");
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
      setMessage("Please log in as an admin.");
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
        throw new Error(result.message || "Failed to save project.");
      }

      setMessage("Project saved successfully!");

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
      setMessage(error.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="project-form-container">
      <h2>Add Project</h2>

      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Project Title</label>
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
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="Available">Available</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div>
          <label htmlFor="location">Location</label>
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
          <label htmlFor="image">Project Image</label>
          <input
            id="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
          />
        </div>

        {image && (
          <div>
            <p>Selected image: {image.name}</p>
            <img
              src={URL.createObjectURL(image)}
              alt="Selected project preview"
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
          <p>Image uploaded successfully.</p>
        )}

        <button type="submit" disabled={saving || uploading}>
          {uploading
            ? "Uploading Image..."
            : saving
            ? "Saving Project..."
            : "Save Project"}
        </button>
      </form>
    </div>
  );
};

export default ProjectForm;