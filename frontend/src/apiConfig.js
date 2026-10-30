export const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://house-selling-website.onrender.com/api";

export const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

export const BOOKING_API_ENABLED =
  String(import.meta.env.VITE_BOOKING_API_ENABLED || "").toLowerCase() === "true";
