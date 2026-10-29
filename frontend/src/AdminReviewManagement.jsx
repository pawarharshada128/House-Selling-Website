import { useCallback, useEffect, useState } from "react";
import { API_URL } from "./apiConfig";
import "./AdminReviewManagement.css";

function AdminReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState("All");
  const [rating, setRating] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = localStorage.getItem("token");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (status !== "All") params.set("status", status);
      if (rating !== "All") params.set("rating", rating);
      if (search) params.set("search", search);
      const response = await fetch(`${API_URL}/reviews/admin?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load reviews.");
      setReviews(data.reviews || []);
      setPages(data.pages || 0);
    } catch (requestError) {
      console.error("Admin review load error:", requestError);
      setError(requestError.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, [page, rating, search, status, token]);

  useEffect(() => {
    const timer = window.setTimeout(loadReviews, 0);
    return () => window.clearTimeout(timer);
  }, [loadReviews]);

  const moderateReview = async (review, nextStatus) => {
    setSavingId(review._id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/reviews/${review._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to update review.");
      setNotice(data.message);
      await loadReviews();
    } catch (requestError) {
      console.error("Review moderation error:", requestError);
      setError(requestError.message || "Unable to update review.");
    } finally {
      setSavingId("");
    }
  };

  const deleteReview = async (review) => {
    if (!window.confirm(`Permanently delete "${review.title}" by ${review.customer?.name || "this customer"}?`)) {
      return;
    }
    setSavingId(review._id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/reviews/${review._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete review.");
      setNotice(data.message);
      await loadReviews();
    } catch (requestError) {
      console.error("Review deletion error:", requestError);
      setError(requestError.message || "Unable to delete review.");
    } finally {
      setSavingId("");
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <section className="admin-reviews">
      <div className="admin-reviews-heading">
        <div>
          <span className="section-label">CUSTOMER FEEDBACK</span>
          <h1>Reviews Management</h1>
          <p>Review customer submissions and moderate publication status.</p>
        </div>
        <button type="button" onClick={loadReviews} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <form className="admin-review-filters" onSubmit={submitSearch}>
        <label>
          Status
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option>All</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </label>
        <label>
          Rating
          <select value={rating} onChange={(event) => { setRating(event.target.value); setPage(1); }}>
            <option>All</option>
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>{value} stars</option>
            ))}
          </select>
        </label>
        <label className="admin-review-search">
          Search customer or review
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Customer name, title, or text"
          />
        </label>
        <button type="submit">Search</button>
      </form>

      {notice && <p className="admin-review-notice success" role="status">{notice}</p>}
      {error && <p className="admin-review-notice error" role="alert">{error}</p>}
      {loading ? (
        <p className="admin-review-state" role="status">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="admin-review-state">No reviews match the selected filters.</p>
      ) : (
        <div className="admin-review-list">
          {reviews.map((review) => {
            const projectName =
              review.projectName ||
              review.property?.title ||
              review.enquiry?.propertyTitle ||
              "Construction project";
            return (
              <article className="admin-review-card" key={review._id}>
                <div className="admin-review-card-heading">
                  <div>
                    <h2>{review.title}</h2>
                    <span className="admin-review-stars" aria-label={`${review.rating} out of 5 stars`}>
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </span>
                  </div>
                  <span className={`admin-review-status status-${review.status.toLowerCase()}`}>
                    {review.status}
                  </span>
                </div>
                <p className="admin-review-description">{review.description}</p>
                <dl className="admin-review-details">
                  <div><dt>Customer</dt><dd>{review.customer?.name || "Unknown"}{review.customer?.email ? ` · ${review.customer.email}` : ""}</dd></div>
                  <div><dt>Property / project</dt><dd>{projectName}</dd></div>
                  <div><dt>Submitted</dt><dd>{new Date(review.createdAt).toLocaleString()}</dd></div>
                  <div><dt>Verification</dt><dd>{review.verified ? "Completed customer record verified" : "Not verified"}</dd></div>
                </dl>
                <div className="admin-review-actions">
                  {review.status === "Pending" && (
                    <>
                      <button
                        type="button"
                        className="approve"
                        disabled={savingId === review._id}
                        onClick={() => moderateReview(review, "Approved")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="reject"
                        disabled={savingId === review._id}
                        onClick={() => moderateReview(review, "Rejected")}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="delete"
                    disabled={savingId === review._id}
                    onClick={() => deleteReview(review)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="admin-review-pagination">
          <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>
            Previous
          </button>
          <span>Page {page} of {pages}</span>
          <button type="button" disabled={page >= pages || loading} onClick={() => setPage((current) => current + 1)}>
            Next
          </button>
        </div>
      )}
    </section>
  );
}

export default AdminReviewManagement;
