import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "./apiConfig";
import "./ReviewsSection.css";

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Unable to complete this request.");
  }
  return data;
};

const RatingStars = ({ rating, label }) => (
  <span className="reviews-stars" aria-label={label || `${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={star <= rating ? "is-filled" : ""} aria-hidden="true">
        ★
      </span>
    ))}
  </span>
);

function ReviewsSection() {
  const navigate = useNavigate();
  const [sort, setSort] = useState("newest");
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    average: 0,
    count: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const [eligible, setEligible] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [enquiryId, setEnquiryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadReviews = useCallback(async (nextPage = 1, append = false) => {
    setLoading(true);
    setError("");
    try {
      const data = await requestJson(
        `${API_URL}/reviews?sort=${sort}&page=${nextPage}&limit=6`
      );
      setReviews((previous) =>
        append ? [...previous, ...(data.reviews || [])] : data.reviews || []
      );
      setSummary(data.summary || {
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
      setPage(data.page || nextPage);
      setPages(data.pages || 0);
    } catch (requestError) {
      console.error("Load reviews error:", requestError);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  const loadCustomerReviews = useCallback(async () => {
    if (!token || user?.role !== "buyer") return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [eligibleData, mineData] = await Promise.all([
        requestJson(`${API_URL}/reviews/eligible`, { headers }),
        requestJson(`${API_URL}/reviews/mine`, { headers }),
      ]);
      setEligible(eligibleData.eligible || []);
      setMyReviews(mineData.reviews || []);
      setEnquiryId((current) =>
        eligibleData.eligible?.some((entry) => entry.id === current)
          ? current
          : eligibleData.eligible?.[0]?.id || ""
      );
    } catch (requestError) {
      console.error("Load customer review details error:", requestError);
      setFeedback({ type: "error", text: requestError.message });
    }
  }, [token, user?.role]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadReviews(1, false), 0);
    return () => window.clearTimeout(timer);
  }, [loadReviews]);

  useEffect(() => {
    const timer = window.setTimeout(loadCustomerReviews, 0);
    return () => window.clearTimeout(timer);
  }, [loadCustomerReviews]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    if (!token || user?.role !== "buyer") {
      navigate("/login", { state: { returnTo: "/" } });
      return;
    }
    if (!enquiryId || !rating) {
      setFeedback({ type: "error", text: "Choose an eligible completed project and a star rating." });
      return;
    }

    setSubmitting(true);
    try {
      const data = await requestJson(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enquiryId, rating, title, description }),
      });
      setFeedback({ type: "success", text: data.message });
      setRating(0);
      setTitle("");
      setDescription("");
      await Promise.all([loadReviews(1, false), loadCustomerReviews()]);
    } catch (requestError) {
      console.error("Submit review error:", requestError);
      setFeedback({ type: "error", text: requestError.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="reviews-section" id="reviews">
      <div className="reviews-container">
        <div className="reviews-heading">
          <div>
            <span className="section-label">CUSTOMER EXPERIENCES</span>
            <h2>What Our Customers Say</h2>
            <p>Feedback from customers whose completed property or construction work has been verified.</p>
          </div>
          <label className="reviews-sort">
            Sort reviews
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </label>
        </div>

        <div className="reviews-overview">
          <div className="reviews-average">
            <strong>{summary.count ? summary.average.toFixed(1) : "—"}</strong>
            <RatingStars rating={Math.round(summary.average)} />
            <span>{summary.count} approved {summary.count === 1 ? "review" : "reviews"}</span>
          </div>
          <div className="reviews-distribution" aria-label="Rating distribution">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = summary.distribution?.[stars] || 0;
              const percent = summary.count ? (count / summary.count) * 100 : 0;
              return (
                <div className="reviews-rating-row" key={stars}>
                  <span>{stars} ★</span>
                  <div className="reviews-rating-track">
                    <span style={{ width: `${percent}%` }} />
                  </div>
                  <span>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {error && <p className="reviews-feedback error" role="alert">{error}</p>}
        {loading && reviews.length === 0 ? (
          <p className="reviews-loading" role="status">Loading customer reviews…</p>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty">
            <h3>No approved reviews yet</h3>
            <p>When customers share their experience and it is approved, it will appear here.</p>
          </div>
        ) : (
          <div className="reviews-grid">
            {reviews.map((review) => (
              <article className="review-card" key={review._id}>
                <div className="review-card-top">
                  <RatingStars rating={review.rating} />
                  {review.verified && (
                    <span className="review-verified" title="Completed customer record verified">
                      ✓ Verified customer
                    </span>
                  )}
                </div>
                <h3>{review.title}</h3>
                <p className="review-description">{review.description}</p>
                {(review.projectName || review.property?.title) && (
                  <p className="review-project">
                    {review.projectName || review.property?.title}
                  </p>
                )}
                <div className="review-author">
                  <strong>{review.customer?.name || "Customer"}</strong>
                  <time dateTime={review.createdAt}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </time>
                </div>
              </article>
            ))}
          </div>
        )}

        {page < pages && (
          <button
            type="button"
            className="reviews-load-more"
            disabled={loading}
            onClick={() => loadReviews(page + 1, true)}
          >
            {loading ? "Loading…" : "Load More Reviews"}
          </button>
        )}

        <div className="review-form-panel">
          <div className="review-form-heading">
            <span className="section-label">SHARE YOUR EXPERIENCE</span>
            <h3>Write a Review</h3>
            <p>Reviews are linked to a completed booking or construction request and published after moderation.</p>
          </div>

          {feedback && (
            <p className={`reviews-feedback ${feedback.type}`} role={feedback.type === "error" ? "alert" : "status"}>
              {feedback.text}
            </p>
          )}

          {!token ? (
            <button
              type="button"
              className="reviews-primary-button"
              onClick={() => navigate("/login", { state: { returnTo: "/" } })}
            >
              Log in to review
            </button>
          ) : user?.role !== "buyer" ? (
            <p className="reviews-note">Reviews can only be submitted from a buyer account.</p>
          ) : eligible.length === 0 ? (
            <p className="reviews-note">
              No completed property booking or construction project is currently eligible for review.
            </p>
          ) : (
            <form className="review-form" onSubmit={handleSubmit}>
              <label>
                Completed property or project
                <select
                  required
                  value={enquiryId}
                  onChange={(event) => setEnquiryId(event.target.value)}
                >
                  {eligible.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.title} ({entry.type === "BuildRequest" ? "Construction" : "Property"})
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="review-star-field">
                <legend>Your rating <span aria-hidden="true">*</span></legend>
                <div className="review-star-picker" role="radiogroup" aria-label="Star rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      role="radio"
                      aria-checked={rating === star}
                      aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
                      className={(hoverRating || rating) >= star ? "is-filled" : ""}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onFocus={() => setHoverRating(star)}
                      onBlur={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                Review title
                <input
                  required
                  minLength="3"
                  maxLength="120"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Summarize your experience"
                />
              </label>
              <label>
                Your review
                <textarea
                  required
                  minLength="20"
                  maxLength="2000"
                  rows="5"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Tell us about your experience (20–2000 characters)"
                />
              </label>
              <button
                type="submit"
                className="reviews-primary-button"
                disabled={submitting || !rating}
              >
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </form>
          )}

          {myReviews.length > 0 && (
            <div className="my-reviews">
              <h4>Your submitted reviews</h4>
              {myReviews.map((review) => (
                <p key={review._id}>
                  <strong>{review.title}</strong>
                  <span className={`review-status status-${review.status.toLowerCase()}`}>
                    {review.status}
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ReviewsSection;
