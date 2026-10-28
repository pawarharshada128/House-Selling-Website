import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "./LocaleContext";
import { isBuildLandRequest } from "./enquiryUtils";
import "./MyEnquiries.css";

const API_URL = "https://house-selling-website.onrender.com/api";

const FILTERS = [
  "All",
  "Pending",
  "In Progress",
  "Visit Scheduled",
  "Completed",
  "Rejected",
  "Cancelled",
];

const formatDate = (value, language, withTime = false) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN", withTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" });
};

const enquiryType = (enquiry) => {
  if (isBuildLandRequest(enquiry)) return "Construction Request";
  if (enquiry.requestType === "PropertyBooking" || enquiry.propertyId) return "Property Enquiry";
  return "General Enquiry";
};

function MyEnquiries() {
  const navigate = useNavigate();
  const { t, language } = useLocale();
  const [enquiries, setEnquiries] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
    } catch (parseError) {
      console.error("Unable to read saved user:", parseError);
    }

    if (!token || user?.role !== "buyer") {
      navigate("/login", {
        replace: true,
        state: { returnTo: "/my-enquiries" },
      });
      return;
    }

    let cancelled = false;
    const loadEnquiries = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_URL}/enquiries/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login", {
            replace: true,
            state: { returnTo: "/my-enquiries" },
          });
          return;
        }
        if (!response.ok) {
          const message = response.status === 404
            ? "Customer enquiry tracking is not available on the server yet. Please deploy the latest backend."
            : data.message || "Unable to load your enquiries.";
          throw new Error(message);
        }
        if (!cancelled) setEnquiries(data.enquiries || []);
      } catch (loadError) {
        console.error("My enquiries error:", loadError);
        if (!cancelled) setError(loadError.message || "Unable to load your enquiries.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadEnquiries();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const filteredEnquiries = useMemo(() => {
    if (filter === "All") return enquiries;
    return enquiries.filter((enquiry) => {
      const status = enquiry.status || "Pending";
      if (filter === "Visit Scheduled") {
        return status === filter ||
          status === "Site Visit Scheduled" ||
          enquiry.siteVisits?.some((visit) => visit.status === "Scheduled");
      }
      return status === filter || (filter === "Pending" && status === "New");
    });
  }, [enquiries, filter]);

  return (
    <main className="my-enquiries-page">
      <header className="my-enquiries-header">
        <div>
          <span className="my-enquiries-eyebrow">{t("CUSTOMER ACCOUNT")}</span>
          <h1>{t("My Enquiries")}</h1>
          <p>{t("Track your property enquiries and construction requests.")}</p>
        </div>
        <button type="button" onClick={() => navigate("/")}>{t("Browse Website")}</button>
      </header>

      <section className="my-enquiries-content" aria-live="polite">
        <div className="my-enquiries-filters" aria-label={t("Filter enquiries")}>
          {FILTERS.map((item) => (
            <button
              type="button"
              key={item}
              className={filter === item ? "active" : ""}
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
            >
              {t(item)}
            </button>
          ))}
        </div>

        {loading && <p className="my-enquiries-state">{t("Loading enquiries...")}</p>}
        {!loading && error && <p className="my-enquiries-state error" role="alert">{t(error)}</p>}
        {!loading && !error && filteredEnquiries.length === 0 && (
          <div className="my-enquiries-empty">
            <h2>{t(enquiries.length ? "No enquiries match this filter" : "You have no enquiries yet")}</h2>
            <p>{t(enquiries.length
              ? "Try another status filter."
              : "When you submit a property enquiry or construction request, it will appear here.")}</p>
            {!enquiries.length && (
              <button type="button" onClick={() => navigate("/")}>{t("Explore Properties")}</button>
            )}
          </div>
        )}

        <div className="my-enquiry-list">
          {filteredEnquiries.map((enquiry) => {
            const property = enquiry.propertyId && typeof enquiry.propertyId === "object"
              ? enquiry.propertyId
              : null;
            const title = property?.title || enquiry.propertyTitle || enquiryType(enquiry);
            const latestUpdate = [
              enquiry.updatedAt,
              enquiry.statusHistory?.[enquiry.statusHistory.length - 1]?.changedAt,
              enquiry.propertyOffer?.updatedAt,
              enquiry.quotation?.updatedAt,
              enquiry.progressUpdates?.[enquiry.progressUpdates.length - 1]?.updatedAt,
            ].filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0];
            return (
              <article className="my-enquiry-card" key={enquiry._id}>
                <header className="my-enquiry-card-header">
                  <div>
                    <span className="my-enquiry-type">{t(enquiryType(enquiry))}</span>
                    <h2>{title}</h2>
                    <p>{t("Reference ID")}: <code>{enquiry._id}</code></p>
                    <p>{t("Submitted")}: {formatDate(enquiry.createdAt, language)}</p>
                    {latestUpdate && <p>{t("Latest update")}: {formatDate(latestUpdate, language, true)}</p>}
                  </div>
                  <span className={`my-enquiry-status ${String(enquiry.status || "Pending").toLowerCase().replaceAll(" ", "-")}`}>
                    {t(enquiry.status || "Pending")}
                  </span>
                </header>

                {property?.location && <p><strong>{t("Location")}:</strong> {property.location}</p>}
                <section className="my-enquiry-section">
                  <h3>{t("Your message")}</h3>
                  <p className="my-enquiry-message">{enquiry.message}</p>
                </section>

                {enquiry.siteVisits?.length > 0 && (
                  <section className="my-enquiry-section">
                    <h3>{t("Visits and inspections")}</h3>
                    {enquiry.siteVisits.map((visit) => (
                      <div className="my-enquiry-update" key={visit._id || visit.scheduledAt}>
                        <strong>{t(visit.visitType || "Property Visit")} · {t(visit.status || "Scheduled")}</strong>
                        <p>{formatDate(visit.scheduledAt, language, true)}</p>
                        {visit.location && <p><strong>{t("Location")}:</strong> {visit.location}</p>}
                        {visit.notes && <p>{visit.notes}</p>}
                        {visit.instructions && <p>{visit.instructions}</p>}
                      </div>
                    ))}
                  </section>
                )}

                {enquiry.propertyOffer && enquiry.propertyOffer.status !== "Draft" && (
                  <section className="my-enquiry-section">
                    <h3>{t("Property Offer")}</h3>
                    <div className="my-enquiry-update">
                      {enquiry.propertyOffer.title && <strong>{enquiry.propertyOffer.title}</strong>}
                      <p><strong>{t("Offer amount")}:</strong> ₹{Number(enquiry.propertyOffer.amount).toLocaleString("en-IN")}</p>
                      {Number(enquiry.propertyOffer.discountAmount) > 0 && <p><strong>{t("Discount")}:</strong> ₹{Number(enquiry.propertyOffer.discountAmount).toLocaleString("en-IN")}</p>}
                      {Number(enquiry.propertyOffer.discountPercent) > 0 && <p><strong>{t("Discount")}:</strong> {enquiry.propertyOffer.discountPercent}%</p>}
                      {enquiry.propertyOffer.details && <p>{enquiry.propertyOffer.details}</p>}
                      <p>{t("Offer status")}: {t(enquiry.propertyOffer.status)}</p>
                      {enquiry.propertyOffer.validUntil && <p>{t("Valid until")}: {formatDate(enquiry.propertyOffer.validUntil, language)}</p>}
                    </div>
                  </section>
                )}

                {enquiry.quotation && enquiry.quotation.status !== "Draft" && (
                  <section className="my-enquiry-section">
                    <h3>{t("Construction Quotation")} <span className="estimate-label">{t("Estimate only")}</span></h3>
                    <div className="my-enquiry-update">
                      {enquiry.quotation.reference && <p><strong>{t("Reference")}:</strong> {enquiry.quotation.reference}</p>}
                      <p><strong>{t("Estimated total")}:</strong> ₹{Number(enquiry.quotation.amount).toLocaleString("en-IN")}</p>
                      {enquiry.quotation.description && <p>{enquiry.quotation.description}</p>}
                      {Number(enquiry.quotation.materialCost) > 0 && <p><strong>{t("Material cost")}:</strong> ₹{Number(enquiry.quotation.materialCost).toLocaleString("en-IN")}</p>}
                      {Number(enquiry.quotation.labourCost) > 0 && <p><strong>{t("Labour cost")}:</strong> ₹{Number(enquiry.quotation.labourCost).toLocaleString("en-IN")}</p>}
                      {Number(enquiry.quotation.additionalCharges) > 0 && <p><strong>{t("Additional charges")}:</strong> ₹{Number(enquiry.quotation.additionalCharges).toLocaleString("en-IN")}</p>}
                      {enquiry.quotation.details && <p>{enquiry.quotation.details}</p>}
                      <p>{t("Quotation status")}: {t(enquiry.quotation.status)}</p>
                      {enquiry.quotation.validUntil && <p>{t("Valid until")}: {formatDate(enquiry.quotation.validUntil, language)}</p>}
                    </div>
                  </section>
                )}

                {enquiry.progressUpdates?.length > 0 && (
                  <section className="my-enquiry-section">
                    <h3>{t("Construction Progress")}</h3>
                    <ol className="my-enquiry-timeline">
                      {[...enquiry.progressUpdates]
                        .sort((a, b) => new Date(a.updateDate || a.createdAt) - new Date(b.updateDate || b.createdAt))
                        .map((update) => (
                          <li key={update._id || `${update.title}-${update.updateDate}`}>
                            <strong>{update.title}</strong>
                            <span>{formatDate(update.updateDate || update.createdAt, language)} · {t(update.status)} · {update.progress}%</span>
                            <div className="my-enquiry-progress" role="progressbar" aria-valuenow={Math.min(100, Math.max(0, Number(update.progress || 0)))} aria-valuemin="0" aria-valuemax="100">
                              <span style={{ width: `${Math.min(100, Math.max(0, Number(update.progress || 0)))}%` }} />
                            </div>
                            {update.startDate && <span>{t("Start date")}: {formatDate(update.startDate, language)}</span>}
                            {update.targetCompletionDate && <span>{t("Target completion date")}: {formatDate(update.targetCompletionDate, language)}</span>}
                            {update.actualCompletionDate && <span>{t("Actual completion date")}: {formatDate(update.actualCompletionDate, language)}</span>}
                            {update.description && <p>{update.description}</p>}
                            {update.remarks && <p><strong>{t("Remarks")}:</strong> {update.remarks}</p>}
                          </li>
                        ))}
                    </ol>
                  </section>
                )}

                {enquiry.statusHistory?.length > 0 && (
                  <details className="my-enquiry-history">
                    <summary>{t("Status history")}</summary>
                    <ol>
                      {[...enquiry.statusHistory]
                        .sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt))
                        .map((entry, index) => (
                          <li key={`${entry.status}-${entry.changedAt}-${index}`}>
                            <strong>{t(entry.status)}</strong>
                            <span>{formatDate(entry.changedAt, language, true)}</span>
                            {entry.remarks && <p>{entry.remarks}</p>}
                          </li>
                        ))}
                    </ol>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default MyEnquiries;
