import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "./LocaleContext";
import { isBuildLandRequest } from "./enquiryUtils";
import { API_URL, SERVER_URL } from "./apiConfig";
import "./MyEnquiries.css";

const STATUS_FILTERS = [
  "All",
  "Pending",
  "In Progress",
  "Visit Scheduled",
  "Completed",
  "Rejected",
  "Cancelled",
];

const COMPANY_PHONE = "+91 98765 43210";
const COMPANY_EMAIL = "shreekrishna_constructions@gmail.com";
const STATUS_ALIASES = {
  Pending: ["Pending", "New"],
  "In Progress": [
    "In Progress",
    "Booking in Progress",
    "Booking Confirmed",
    "Offer Accepted",
    "Offer Made",
    "Quotation in Preparation",
    "Quotation Sent",
    "Contacted",
    "Approved",
  ],
  "Visit Scheduled": ["Visit Scheduled", "Site Visit Scheduled"],
  Completed: ["Completed"],
  Rejected: ["Rejected", "Offer Rejected"],
  Cancelled: ["Cancelled", "Closed"],
};

const dateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value, language, withTime = false) => {
  const date = dateValue(value);
  if (!date) return "";
  const locale =
    language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN";
  return date.toLocaleString(
    locale,
    withTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" }
  );
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return `₹${amount.toLocaleString("en-IN")}`;
};

const enquiryType = (enquiry, t) => {
  if (isBuildLandRequest(enquiry)) return t("Construction Request");
  if (
    enquiry.requestType === "PropertyBooking" ||
    enquiry.type === "PropertyBooking"
  ) {
    return t("Property Booking");
  }
  if (enquiry.propertyId) return t("Property Enquiry");
  return t("General Enquiry");
};

const statusClass = (status) =>
  String(status || "Pending")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const validEntries = (entries) =>
  Array.isArray(entries) ? entries.filter((entry) => entry && typeof entry === "object") : [];

const enquiryTimestamp = (enquiry) => {
  const date = dateValue(enquiry.createdAt);
  return date ? date.getTime() : 0;
};

const getLatestUpdate = (enquiry) => {
  const dates = [
    enquiry.updatedAt,
    ...validEntries(enquiry.statusHistory).map((entry) => entry.changedAt),
    enquiry.propertyOffer?.updatedAt,
    enquiry.quotation?.updatedAt,
    ...validEntries(enquiry.siteVisits).map((visit) => visit.updatedAt || visit.createdAt),
    ...validEntries(enquiry.progressUpdates).map(
      (entry) => entry.updatedAt || entry.updateDate || entry.createdAt
    ),
  ]
    .map(dateValue)
    .filter(Boolean)
    .sort((left, right) => right.getTime() - left.getTime());
  return dates[0] || null;
};

const getProperty = (enquiry) =>
  enquiry.propertyId && typeof enquiry.propertyId === "object"
    ? enquiry.propertyId
    : null;

const isVisitScheduled = (enquiry) =>
  ["Visit Scheduled", "Site Visit Scheduled"].includes(enquiry.status) ||
  validEntries(enquiry.siteVisits).some((visit) => visit.status === "Scheduled");

const filterMatchesStatus = (enquiry, filter) => {
  if (filter === "All") return true;
  if (filter === "Visit Scheduled") return isVisitScheduled(enquiry);
  return (STATUS_ALIASES[filter] || [filter]).includes(enquiry.status || "Pending");
};

function MyEnquiries() {
  const navigate = useNavigate();
  const { t, language } = useLocale();
  const [enquiries, setEnquiries] = useState([]);
  const [bookingsByEnquiry, setBookingsByEnquiry] = useState({});
  const [bookingLoadError, setBookingLoadError] = useState("");
  const [respondingOfferId, setRespondingOfferId] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [copiedId, setCopiedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadEnquiries = useCallback(async (signal, showLoading = true) => {
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

    if (showLoading) setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/enquiries/mine`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

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
        const message =
          response.status === 404
            ? t("Customer enquiry tracking is not available on the server yet. Please deploy the latest backend.")
            : data.message || t("Unable to load your enquiries.");
        throw new Error(message);
      }
      if (!Array.isArray(data.enquiries)) {
        throw new Error(t("The enquiry response from the server was invalid."));
      }
      setEnquiries(data.enquiries);

      try {
        const bookingsResponse = await fetch(`${API_URL}/bookings/mine`, {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        });
        const bookingsData = await bookingsResponse.json();
        if (!bookingsResponse.ok) {
          throw new Error(
            bookingsResponse.status === 404
              ? t("Booking details are unavailable because the updated booking API has not been deployed to the server yet.")
              : bookingsData.message || t("Unable to load your booking details.")
          );
        }
        if (!Array.isArray(bookingsData.bookings)) {
          throw new Error(t("The booking response from the server was invalid."));
        }
        setBookingsByEnquiry(
          Object.fromEntries(
            bookingsData.bookings.map((booking) => [
              String(booking.enquiry),
              booking,
            ])
          )
        );
        setBookingLoadError("");
      } catch (bookingError) {
        if (bookingError.name === "AbortError") return;
        console.error("My bookings error:", bookingError);
        setBookingsByEnquiry({});
        setBookingLoadError(
          bookingError.message || t("Unable to load your booking details.")
        );
      }
    } catch (loadError) {
      if (loadError.name === "AbortError") return;
      console.error("My enquiries error:", loadError);
      setError(loadError.message || t("Unable to load your enquiries."));
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [navigate, t]);

  const respondToOffer = async (enquiryId, response) => {
    setRespondingOfferId(enquiryId);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const result = await fetch(
        `${API_URL}/enquiries/${enquiryId}/property-offer-response`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
          body: JSON.stringify({ response }),
        }
      );
      const data = await result.json();
      if (result.status === 401 || result.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", {
          replace: true,
          state: { returnTo: "/my-enquiries" },
        });
        return;
      }
      if (!result.ok) throw new Error(data.message || t("Unable to respond to this offer."));
      setEnquiries((previous) =>
        previous.map((enquiry) =>
          enquiry._id === enquiryId ? data.enquiry : enquiry
        )
      );
    } catch (responseError) {
      console.error("Offer response error:", responseError);
      setError(responseError.message || t("Unable to respond to this offer."));
    } finally {
      setRespondingOfferId("");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const refresh = (showLoading = false) => {
      if (document.visibilityState === "visible") {
        loadEnquiries(controller.signal, showLoading);
      }
    };
    const refreshOnFocus = () => refresh();
    const refreshOnVisibilityChange = () => refresh();

    refresh(true);
    const intervalId = window.setInterval(() => refresh(), 30000);
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisibilityChange);
      controller.abort();
    };
  }, [loadEnquiries, reloadKey]);

  const summary = useMemo(() => {
    const counts = {
      total: enquiries.length,
      pending: 0,
      inProgress: 0,
      visits: 0,
      completed: 0,
    };
    enquiries.forEach((enquiry) => {
      const status = enquiry.status || "Pending";
      if (STATUS_ALIASES.Pending.includes(status)) counts.pending += 1;
      if (STATUS_ALIASES["In Progress"].includes(status)) counts.inProgress += 1;
      if (isVisitScheduled(enquiry)) counts.visits += 1;
      if (status === "Completed") counts.completed += 1;
    });
    return counts;
  }, [enquiries]);

  const filteredEnquiries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return enquiries
      .filter((enquiry) => {
        const buildRequest = isBuildLandRequest(enquiry);
        const matchesType =
          typeFilter === "All" ||
          (typeFilter === "Construction" && buildRequest) ||
          (typeFilter === "Property" && !buildRequest);
        const property = getProperty(enquiry);
        const text = [
          enquiry.name,
          enquiry.email,
          enquiry.phone,
          property?.title,
          enquiry.propertyTitle,
          enquiry._id,
          property?.location,
          property?.property_type,
          property?.description,
          enquiry.buildDetails?.landLocation,
          enquiry.buildDetails?.plotArea,
          enquiry.buildDetails?.homeType,
          enquiry.buildDetails?.homeSize,
          enquiry.buildDetails?.preferredDesign,
          enquiry.buildDetails?.additionalRequirements,
          enquiry.message,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();
        return (
          matchesType &&
          filterMatchesStatus(enquiry, statusFilter) &&
          (!query || text.includes(query))
        );
      })
      .sort((left, right) =>
        sort === "oldest"
          ? enquiryTimestamp(left) - enquiryTimestamp(right)
          : enquiryTimestamp(right) - enquiryTimestamp(left)
      );
  }, [enquiries, search, sort, statusFilter, typeFilter]);

  const summaryCards = [
    { label: t("Total Enquiries"), value: summary.total, filter: "All", key: "total" },
    { label: t("Pending"), value: summary.pending, filter: "Pending", key: "pending" },
    { label: t("In Progress"), value: summary.inProgress, filter: "In Progress", key: "progress" },
    { label: t("Scheduled Visits"), value: summary.visits, filter: "Visit Scheduled", key: "visits" },
    { label: t("Completed"), value: summary.completed, filter: "Completed", key: "completed" },
  ];

  const toggleExpanded = (id) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyReference = async (id) => {
    try {
      await navigator.clipboard.writeText(String(id));
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(""), 1800);
    } catch (copyError) {
      console.error("Copy reference error:", copyError);
      setError(t("Could not copy the reference ID. Please copy it manually."));
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
    setSort("newest");
  };

  const browseProperties = () =>
    navigate("/", { state: { scrollTo: "properties" } });

  const contactPhone = COMPANY_PHONE.replace(/[^\d+]/g, "");
  const whatsappNumber = COMPANY_PHONE.replace(/\D/g, "");
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    t("Hello, I have a question about my enquiry.")
  )}`;

  return (
    <main className="my-enquiries-page">
      <header className="my-enquiries-header">
        <div>
          <span className="my-enquiries-eyebrow">{t("CUSTOMER ACCOUNT")}</span>
          <h1>{t("My Enquiries")}</h1>
          <p>{t("Track your property enquiries and construction requests.")}</p>
        </div>
        <button type="button" className="my-enquiries-browse" onClick={browseProperties}>
          {t("Browse Properties")}
        </button>
      </header>

      <section className="my-enquiries-content" aria-live="polite">
        <div className="my-enquiries-summary" aria-label={t("Enquiry summary")}>
          {summaryCards.map((card) => (
            <button
              type="button"
              key={card.key}
              className={`my-enquiries-summary-card ${
                card.key === "total"
                  ? statusFilter === "All" && typeFilter === "All" && !search
                    ? "active"
                    : ""
                  : statusFilter === card.filter
                    ? "active"
                    : ""
              }`}
              onClick={() => {
                setStatusFilter(card.filter);
                if (card.key === "total") {
                  setTypeFilter("All");
                  setSearch("");
                }
              }}
              aria-pressed={
                card.key === "total"
                  ? statusFilter === "All" && typeFilter === "All" && !search
                  : statusFilter === card.filter
              }
            >
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </button>
          ))}
        </div>

        <div className="my-enquiries-toolbar">
          <label className="my-enquiries-search">
            <span>{t("Search enquiries")}</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("Search property, reference ID, or location")}
            />
          </label>
          <label className="my-enquiries-sort">
            <span>{t("Sort by")}</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="newest">{t("Newest first")}</option>
              <option value="oldest">{t("Oldest first")}</option>
            </select>
          </label>
        </div>

        <div className="my-enquiries-filter-row">
          <div className="my-enquiries-filter-group" aria-label={t("Filter by type")}>
            {[
              ["All", t("All Types")],
              ["Property", t("Property Enquiries")],
              ["Construction", t("Construction Requests")],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={typeFilter === value ? "active" : ""}
                aria-pressed={typeFilter === value}
                onClick={() => setTypeFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="my-enquiries-filter-group status-filters" aria-label={t("Filter enquiries by status")}>
            {STATUS_FILTERS.map((item) => (
              <button
                type="button"
                key={item}
                className={statusFilter === item ? "active" : ""}
                aria-pressed={statusFilter === item}
                onClick={() => setStatusFilter(item)}
              >
                {t(item)}
              </button>
            ))}
          </div>
          {(search || typeFilter !== "All" || statusFilter !== "All" || sort !== "newest") && (
            <button type="button" className="my-enquiries-clear" onClick={clearFilters}>
              {t("Clear filters")}
            </button>
          )}
        </div>

        {error && !loading && (
          <div className="my-enquiries-state error" role="alert">
            <p>{t(error)}</p>
            <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
              {t("Retry")}
            </button>
          </div>
        )}
        {bookingLoadError && !error && !loading && (
          <div className="my-enquiries-state error" role="status">
            <p>{t(bookingLoadError)}</p>
            <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
              {t("Retry")}
            </button>
          </div>
        )}

        {loading && (
          <div className="my-enquiry-list" aria-label={t("Loading enquiries")} aria-busy="true">
            {[1, 2, 3].map((item) => (
              <div className="my-enquiry-skeleton" key={item}>
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && enquiries.length === 0 && (
          <div className="my-enquiries-empty">
            <span className="my-enquiries-empty-icon" aria-hidden="true">⌂</span>
            <h2>{t("You have no enquiries yet")}</h2>
            <p>{t("When you submit a property enquiry or construction request, it will appear here.")}</p>
            <button type="button" onClick={browseProperties}>{t("Explore Properties")}</button>
          </div>
        )}

        {!loading && !error && enquiries.length > 0 && filteredEnquiries.length === 0 && (
          <div className="my-enquiries-empty">
            <h2>{t("No enquiries match your filters")}</h2>
            <p>{t("Try another search or filter to find your enquiry.")}</p>
            <button type="button" onClick={clearFilters}>{t("Clear filters")}</button>
          </div>
        )}

        {!loading && !error && filteredEnquiries.length > 0 && (
          <div className="my-enquiry-list">
            {filteredEnquiries.map((enquiry) => {
              const property = getProperty(enquiry);
              const buildRequest = isBuildLandRequest(enquiry);
              const status = enquiry.status || "Pending";
              const title =
                property?.title ||
                enquiry.propertyTitle ||
                (buildRequest
                  ? enquiry.buildDetails?.homeType || t("Construction Request")
                  : t("Property Enquiry"));
              const image =
                property?.image ||
                (Array.isArray(property?.images) ? property.images.find(Boolean) : "");
              const imageUrl = image
                ? /^https?:\/\//i.test(image)
                  ? image
                  : `${SERVER_URL}${image.startsWith("/") ? "" : "/"}${image}`
                : "";
              const location =
                property?.location || enquiry.buildDetails?.landLocation || "";
              const price = formatCurrency(property?.price);
              const submitted = formatDate(enquiry.createdAt, language);
              const latestUpdate = formatDate(getLatestUpdate(enquiry), language, true);
              const visits = validEntries(enquiry.siteVisits).sort(
                (left, right) =>
                  (dateValue(right.scheduledAt)?.getTime() || 0) -
                  (dateValue(left.scheduledAt)?.getTime() || 0)
              );
              const upcomingVisits = visits.filter(
                (visit) => visit.status === "Scheduled"
              );
              const progressUpdates = validEntries(enquiry.progressUpdates).sort(
                (left, right) =>
                  (dateValue(right.updateDate || right.createdAt)?.getTime() || 0) -
                  (dateValue(left.updateDate || left.createdAt)?.getTime() || 0)
              );
              const history = validEntries(enquiry.statusHistory).sort(
                (left, right) =>
                  (dateValue(left.changedAt)?.getTime() || 0) -
                  (dateValue(right.changedAt)?.getTime() || 0)
              );
              const offer = enquiry.propertyOffer;
              const booking = bookingsByEnquiry[String(enquiry._id)];
              const verifiedAmount = booking?.payments?.reduce(
                (total, payment) => payment.verificationStatus === "Verified"
                  ? total + Number(payment.amount || 0)
                  : total,
                0
              ) || 0;
              const bookingBalance = booking
                ? Math.max(0, Number(booking.agreedAmount || 0) - verifiedAmount)
                : 0;
              const quotation = enquiry.quotation;
              const visibleOffer = offer && offer.status !== "Draft";
              const visibleQuotation = quotation && quotation.status !== "Draft";
              const expanded = expandedIds.has(enquiry._id);

              return (
                <article className="my-enquiry-card" key={enquiry._id}>
                  <div className="my-enquiry-main">
                    <div className="my-enquiry-image-wrap">
                      {imageUrl ? (
                        <>
                          <div className="my-enquiry-image-placeholder" aria-hidden="true">⌂</div>
                          <img
                            src={imageUrl}
                            alt={title}
                            className="my-enquiry-image"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        </>
                      ) : (
                        <div className="my-enquiry-image-placeholder" aria-label={t("Property image unavailable")}>
                          <span aria-hidden="true">⌂</span>
                          <small>{t("HomeFinder")}</small>
                        </div>
                      )}
                    </div>

                    <div className="my-enquiry-main-info">
                      <div className="my-enquiry-title-row">
                        <div>
                          <span className="my-enquiry-type">{enquiryType(enquiry, t)}</span>
                          <h2>{title}</h2>
                        </div>
                        <span className={`my-enquiry-status ${statusClass(status)}`}>
                          {t(status)}
                        </span>
                      </div>

                      <div className="my-enquiry-meta">
                        {location && <span><strong>{t("Location")}:</strong> {location}</span>}
                        {price && <span><strong>{t("Price")}:</strong> {price}</span>}
                        {submitted && <span><strong>{t("Submitted")}:</strong> {submitted}</span>}
                        {latestUpdate && <span><strong>{t("Latest update")}:</strong> {latestUpdate}</span>}
                      </div>

                      {upcomingVisits.length > 0 && (
                        <section className="my-enquiry-visit-notice" aria-live="polite">
                          <h3>{t("Visit Scheduled")}</h3>
                          {upcomingVisits.map((visit, index) => (
                            <div key={visit._id || `${visit.scheduledAt}-${index}`}>
                              <p>
                                <strong>{t(visit.visitType || "Property Visit")}:</strong>{" "}
                                {formatDate(visit.scheduledAt, language, true)}
                              </p>
                              {visit.location && (
                                <p><strong>{t("Visit location")}:</strong> {visit.location}</p>
                              )}
                              {visit.instructions && (
                                <p><strong>{t("Admin instructions")}:</strong> {visit.instructions}</p>
                              )}
                              {visit.notes && (
                                <p><strong>{t("Visit notes")}:</strong> {visit.notes}</p>
                              )}
                            </div>
                          ))}
                        </section>
                      )}

                      {enquiry.message && (
                        <p className="my-enquiry-message">
                          <strong>{t("Your message")}:</strong> {enquiry.message}
                        </p>
                      )}

                      <div className="my-enquiry-reference">
                        <span>{t("Reference ID")}:</span>
                        <code title={String(enquiry._id || "")}>{enquiry._id || t("Unavailable")}</code>
                        {enquiry._id && (
                          <button
                            type="button"
                            className="my-enquiry-copy"
                            onClick={() => copyReference(enquiry._id)}
                            aria-label={t("Copy reference ID")}
                          >
                            {copiedId === enquiry._id ? t("Copied") : t("Copy")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="my-enquiry-card-footer">
                    <div className="my-enquiry-actions">
                      <a href={`tel:${contactPhone}`}>{t("Call us")}</a>
                      <a href={`mailto:${COMPANY_EMAIL}`}>{t("Email us")}</a>
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                        {t("WhatsApp")}
                      </a>
                      {property?._id && (
                        <button type="button" onClick={() => navigate(`/property/${property._id}`)}>
                          {t("View Property")}
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className="my-enquiry-details-toggle"
                      aria-expanded={expanded}
                      aria-controls={`enquiry-details-${enquiry._id}`}
                      onClick={() => toggleExpanded(enquiry._id)}
                    >
                      {expanded ? t("Hide Details") : t("View Details")}
                      <span aria-hidden="true">{expanded ? "−" : "+"}</span>
                    </button>
                  </div>

                  {expanded && (
                    <div className="my-enquiry-details" id={`enquiry-details-${enquiry._id}`}>
                      {(property?.property_type || property?.description || enquiry.buildDetails) && (
                        <section className="my-enquiry-section">
                          <h3>{t("Enquiry details")}</h3>
                          {property?.property_type && <p><strong>{t("Property Type")}:</strong> {property.property_type}</p>}
                          {property?.description && <p className="my-enquiry-preserve">{property.description}</p>}
                          {enquiry.buildDetails && (
                            <dl className="my-enquiry-data-grid">
                              {[
                                ["Land location", enquiry.buildDetails.landLocation],
                                ["Plot area", enquiry.buildDetails.plotArea],
                                ["Home type", enquiry.buildDetails.homeType],
                                ["Home size", enquiry.buildDetails.homeSize],
                                ["Floors", enquiry.buildDetails.floors],
                                ["Bedrooms", enquiry.buildDetails.bedrooms],
                                ["Budget", enquiry.buildDetails.budget],
                                ["Preferred design", enquiry.buildDetails.preferredDesign],
                                ["Additional requirements", enquiry.buildDetails.additionalRequirements],
                              ].filter(([, value]) => value).map(([label, value]) => (
                                <div key={label}>
                                  <dt>{t(label)}</dt>
                                  <dd>{value}</dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </section>
                      )}

                      <section className="my-enquiry-section">
                        <h3>{t("Visits and inspections")}</h3>
                        {visits.length === 0 ? (
                          <p className="my-enquiry-muted">{t("No visits scheduled.")}</p>
                        ) : (
                          <div className="my-enquiry-visit-list">
                            {visits.map((visit, index) => {
                              const scheduledDate = dateValue(visit.scheduledAt);
                              const upcoming =
                                scheduledDate &&
                                scheduledDate.getTime() > Date.now() &&
                                visit.status === "Scheduled";
                              return (
                                <article
                                  className={`my-enquiry-visit ${upcoming ? "upcoming" : statusClass(visit.status)}`}
                                  key={visit._id || `${visit.scheduledAt}-${index}`}
                                >
                                  <div className="my-enquiry-section-heading">
                                    <h4>{t(visit.visitType || "Property Visit")}</h4>
                                    {visit.status && (
                                      <span className={`my-enquiry-status ${statusClass(visit.status)}`}>
                                        {t(visit.status)}
                                      </span>
                                    )}
                                  </div>
                                  {formatDate(visit.scheduledAt, language, true) && (
                                    <p><strong>{t("Scheduled")}:</strong> {formatDate(visit.scheduledAt, language, true)}</p>
                                  )}
                                  {visit.location && <p><strong>{t("Visit location")}:</strong> {visit.location}</p>}
                                  {visit.instructions && <p><strong>{t("Admin instructions")}:</strong> {visit.instructions}</p>}
                                  {visit.notes && <p><strong>{t("Visit notes")}:</strong> {visit.notes}</p>}
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </section>

                      {!buildRequest && (
                        <section className="my-enquiry-section">
                          <h3>{t("Property Offer")}</h3>
                          {!visibleOffer ? (
                            <p className="my-enquiry-muted">{t("No published offer yet.")}</p>
                          ) : (
                            <div className="my-enquiry-update">
                              {offer.title && <h4>{offer.title}</h4>}
                              {formatCurrency(offer.amount) && <p><strong>{t("Offer amount")}:</strong> {formatCurrency(offer.amount)}</p>}
                              {Number(offer.discountAmount) > 0 && <p><strong>{t("Discount")}:</strong> {formatCurrency(offer.discountAmount)}</p>}
                              {Number(offer.discountPercent) > 0 && <p><strong>{t("Discount")}:</strong> {offer.discountPercent}%</p>}
                              {offer.reference && <p><strong>{t("Reference")}:</strong> {offer.reference}</p>}
                              {offer.details && <p>{offer.details}</p>}
                              <p><strong>{t("Offer status")}:</strong> {t(offer.status)}</p>
                              {formatDate(offer.validUntil, language) && <p><strong>{t("Valid until")}:</strong> {formatDate(offer.validUntil, language)}</p>}
                              {offer.status === "Sent" && !booking && (
                                <div className="my-enquiry-offer-actions">
                                  <button
                                    type="button"
                                    disabled={Boolean(respondingOfferId) || (offer.validUntil && new Date(offer.validUntil) < new Date())}
                                    onClick={() => respondToOffer(enquiry._id, "Accepted")}
                                  >
                                    {respondingOfferId === enquiry._id ? t("Saving...") : t("Accept Offer")}
                                  </button>
                                  <button
                                    type="button"
                                    className="my-enquiry-offer-reject"
                                    disabled={Boolean(respondingOfferId) || (offer.validUntil && new Date(offer.validUntil) < new Date())}
                                    onClick={() => respondToOffer(enquiry._id, "Rejected")}
                                  >
                                    {t("Reject Offer")}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </section>
                      )}

                      {!buildRequest && booking && (
                        <section className="my-enquiry-section">
                          <h3>{t("Booking & Payments")}</h3>
                          <div className="my-enquiry-update">
                            <p><strong>{t("Booking reference")}:</strong> {booking.bookingReference}</p>
                            <p><strong>{t("Booking status")}:</strong> {t(booking.bookingStatus)}</p>
                            <p><strong>{t("Agreed amount")}:</strong> {formatCurrency(booking.agreedAmount)}</p>
                            <p><strong>{t("Total verified amount paid")}:</strong> {formatCurrency(verifiedAmount)}</p>
                            <p><strong>{t("Remaining balance")}:</strong> {formatCurrency(bookingBalance)}</p>
                            {formatDate(booking.confirmedAt, language) && (
                              <p><strong>{t("Confirmed")}:</strong> {formatDate(booking.confirmedAt, language)}</p>
                            )}
                            {booking.payments?.length > 0 && (
                              <div className="my-enquiry-payment-history">
                                <strong>{t("Payment history")}</strong>
                                {booking.payments.map((payment) => (
                                  <p key={payment._id}>
                                    {formatDate(payment.paymentDate, language)} · {formatCurrency(payment.amount)} · {t(payment.paymentMethod)} ·{" "}
                                    {t(payment.verificationStatus)}
                                    {payment.transactionReference ? ` · ${payment.transactionReference}` : ""}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </section>
                      )}

                      {buildRequest && (
                        <section className="my-enquiry-section">
                          <h3>{t("Construction Quotation")} <span className="estimate-label">{t("Estimate only")}</span></h3>
                          {!visibleQuotation ? (
                            <p className="my-enquiry-muted">{t("No published quotation yet.")}</p>
                          ) : (
                            <div className="my-enquiry-update">
                              {quotation.reference && <p><strong>{t("Reference")}:</strong> {quotation.reference}</p>}
                              {formatCurrency(quotation.amount) && <p><strong>{t("Estimated total")}:</strong> {formatCurrency(quotation.amount)}</p>}
                              {formatCurrency(quotation.materialCost) && <p><strong>{t("Material cost")}:</strong> {formatCurrency(quotation.materialCost)}</p>}
                              {formatCurrency(quotation.labourCost) && <p><strong>{t("Labour cost")}:</strong> {formatCurrency(quotation.labourCost)}</p>}
                              {formatCurrency(quotation.additionalCharges) && <p><strong>{t("Additional charges")}:</strong> {formatCurrency(quotation.additionalCharges)}</p>}
                              {quotation.description && <p>{quotation.description}</p>}
                              {quotation.details && <p>{quotation.details}</p>}
                              {quotation.status && <p><strong>{t("Quotation status")}:</strong> {t(quotation.status)}</p>}
                              {formatDate(quotation.validUntil, language) && <p><strong>{t("Valid until")}:</strong> {formatDate(quotation.validUntil, language)}</p>}
                            </div>
                          )}
                        </section>
                      )}

                      {buildRequest && (
                        <section className="my-enquiry-section">
                          <h3>{t("Construction Progress")}</h3>
                          {progressUpdates.length === 0 ? (
                            <p className="my-enquiry-muted">{t("No construction updates yet.")}</p>
                          ) : (
                            <ol className="my-enquiry-timeline">
                              {progressUpdates.map((update, index) => {
                                const progress = Number(update.progress);
                                const percentage = Number.isFinite(progress)
                                  ? Math.min(100, Math.max(0, progress))
                                  : 0;
                                return (
                                  <li
                                    className={`my-enquiry-milestone ${statusClass(update.status)}`}
                                    key={update._id || `${update.title}-${update.updateDate || index}`}
                                  >
                                    <div className="my-enquiry-section-heading">
                                      <h4>{update.title}</h4>
                                      {update.status && (
                                        <span className={`my-enquiry-status ${statusClass(update.status)}`}>
                                          {t(update.status)}
                                        </span>
                                      )}
                                    </div>
                                    <span>{formatDate(update.updateDate || update.createdAt, language, true)}</span>
                                    {Number.isFinite(progress) && <p className="my-enquiry-percent">{percentage}% {t("complete")}</p>}
                                    <div
                                      className="my-enquiry-progress"
                                      role="progressbar"
                                      aria-label={update.title}
                                      aria-valuenow={percentage}
                                      aria-valuemin="0"
                                      aria-valuemax="100"
                                    >
                                      <span style={{ width: `${percentage}%` }} />
                                    </div>
                                    <div className="my-enquiry-milestone-dates">
                                      {formatDate(update.startDate, language) && <span><strong>{t("Start date")}:</strong> {formatDate(update.startDate, language)}</span>}
                                      {formatDate(update.targetCompletionDate, language) && <span><strong>{t("Target completion date")}:</strong> {formatDate(update.targetCompletionDate, language)}</span>}
                                      {formatDate(update.actualCompletionDate, language) && <span><strong>{t("Actual completion date")}:</strong> {formatDate(update.actualCompletionDate, language)}</span>}
                                    </div>
                                    {update.description && <p>{update.description}</p>}
                                    {update.remarks && <p><strong>{t("Remarks")}:</strong> {update.remarks}</p>}
                                  </li>
                                );
                              })}
                            </ol>
                          )}
                        </section>
                      )}

                      <section className="my-enquiry-section">
                        <h3>{t("Status history")}</h3>
                        {history.length === 0 ? (
                          <p className="my-enquiry-muted">{t("No status updates available yet.")}</p>
                        ) : (
                          <ol className="my-enquiry-timeline my-enquiry-status-timeline">
                            {history.map((entry, index) => (
                              <li key={`${entry.status}-${entry.changedAt || index}`}>
                                <div className="my-enquiry-section-heading">
                                  <h4>{entry.previousStatus ? `${t(entry.previousStatus)} → ` : ""}{t(entry.status)}</h4>
                                </div>
                                {formatDate(entry.changedAt, language, true) && <span>{formatDate(entry.changedAt, language, true)}</span>}
                                {entry.remarks && <p><strong>{t("Remarks")}:</strong> {entry.remarks}</p>}
                              </li>
                            ))}
                          </ol>
                        )}
                      </section>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default MyEnquiries;
