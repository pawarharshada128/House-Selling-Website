import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL, BOOKING_API_ENABLED, SERVER_URL } from "./apiConfig";
import { useLocale } from "./LocaleContext";
import "./BookingManagement.css";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", { dateStyle: "medium" });
};

const getVerifiedAmount = (booking) =>
  (booking.payments || []).reduce(
    (total, payment) =>
      payment.verificationStatus === "Verified"
        ? total + Number(payment.amount || 0)
        : total,
    0
  );

const getAgreedAmount = (booking) =>
  booking.agreedAmount === undefined || booking.agreedAmount === null
    ? null
    : Number(booking.agreedAmount);

const getBookingBalance = (booking) =>
  getAgreedAmount(booking) === null
    ? null
    : Math.max(0, getAgreedAmount(booking) - getVerifiedAmount(booking));

const getPaymentStatus = (booking) => {
  const total = getAgreedAmount(booking);
  const paid = getVerifiedAmount(booking);
  if (total === null) return "Pending";
  if (total > 0 && paid + 0.005 >= total) return "Fully Paid";
  if (paid > 0) return "Partially Paid";
  return "Pending";
};

const getBookingApiError = (response, data, fallback) =>
  response.status === 404
    ? "Booking and payment APIs are missing from the deployed backend. Deploy the updated backend, then refresh this page."
    : data.message || fallback;

function BookingManagement({ onBookingUpdated, properties = [] }) {
  const { t } = useLocale();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(BOOKING_API_ENABLED);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState("");
  const [bookingApiStatus, setBookingApiStatus] = useState("unchecked");
  const [soldSearch, setSoldSearch] = useState("");
  const [soldPaymentStatus, setSoldPaymentStatus] = useState("All");
  const [bookingDateFrom, setBookingDateFrom] = useState("");
  const [bookingDateTo, setBookingDateTo] = useState("");
  const [soldSort, setSoldSort] = useState("newest");

  const loadBookings = useCallback(async (showLoading = true) => {
    if (!BOOKING_API_ENABLED) return;
    if (showLoading) {
      setLoading(true);
      setError("");
    }
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      const data = await response.json();
      if (response.status === 404) {
        setBookingApiStatus("missing");
        setError(
          "Booking and payment APIs are missing from the deployed backend. Deploy the updated backend, then refresh this page."
        );
        return;
      }
      if (!response.ok) {
        throw new Error(
          getBookingApiError(response, data, "Unable to load bookings.")
        );
      }
      if (!Array.isArray(data.bookings)) {
        throw new Error("The booking response from the server was invalid.");
      }
      setBookings(data.bookings);
      setBookingApiStatus("available");
    } catch (loadError) {
      console.error("Load booking management error:", loadError);
      setError(loadError.message || "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => loadBookings(false), 0);
    return () => window.clearTimeout(timerId);
  }, [loadBookings]);

  const soldBookings = useMemo(
    () => {
      const soldBookingRecords = bookings.filter((booking) =>
        booking.bookingStatus === "Confirmed" || booking.property?.status === "Sold"
      );
      const linkedPropertyIds = new Set(
        soldBookingRecords.map((booking) => String(booking.property?._id || booking.property || ""))
      );
      const unlinkedSoldProperties = properties
        .filter((property) =>
          property.status === "Sold" && !linkedPropertyIds.has(String(property._id))
        )
        .map((property) => ({
          _id: `sold-property-${property._id}`,
          property,
          payments: [],
          isUnlinkedSoldProperty: true,
        }));
      return [...soldBookingRecords, ...unlinkedSoldProperties];
    },
    [bookings, properties]
  );

  const soldSummary = useMemo(
    () => soldBookings.reduce(
      (summary, booking) => {
        const total = getAgreedAmount(booking);
        const paid = getVerifiedAmount(booking);
        return {
          properties: summary.properties + 1,
          value: summary.value + (booking.isUnlinkedSoldProperty
            ? Number(booking.property?.price || 0)
            : total),
          received: summary.received + paid,
          outstanding: summary.outstanding + (booking.isUnlinkedSoldProperty
            ? 0
            : Math.max(0, total - paid)),
          unknownBalances: summary.unknownBalances + (booking.isUnlinkedSoldProperty ? 1 : 0),
        };
      },
      { properties: 0, value: 0, received: 0, outstanding: 0, unknownBalances: 0 }
    ),
    [soldBookings]
  );

  const visibleSoldBookings = useMemo(() => {
    const query = soldSearch.trim().toLowerCase();
    const filtered = soldBookings.filter((booking) => {
      const propertyTitle = booking.property?.title || booking.enquiry?.propertyTitle || "";
      const customerName = booking.buyer?.name || booking.enquiry?.name || "";
      const searchable = [propertyTitle, customerName, booking.bookingReference]
        .join(" ")
        .toLowerCase();
      const bookingDate = booking.createdAt ? new Date(booking.createdAt) : null;
      const matchesStatus =
        soldPaymentStatus === "All" || getPaymentStatus(booking) === soldPaymentStatus;
      const matchesFrom =
        !bookingDateFrom || (bookingDate && bookingDate >= new Date(`${bookingDateFrom}T00:00:00`));
      const matchesTo =
        !bookingDateTo || (bookingDate && bookingDate <= new Date(`${bookingDateTo}T23:59:59.999`));
      return (
        (!query || searchable.includes(query)) &&
        matchesStatus &&
        matchesFrom &&
        matchesTo
      );
    });

    return filtered.sort((first, second) => {
      if (soldSort === "balance") {
        return (getBookingBalance(second) ?? -1) - (getBookingBalance(first) ?? -1);
      }
      return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
    });
  }, [soldBookings, soldSearch, soldPaymentStatus, bookingDateFrom, bookingDateTo, soldSort]);

  const activeBookings = bookings.filter((booking) =>
    !["Confirmed", "Cancelled", "Completed"].includes(booking.bookingStatus) &&
    booking.property?.status !== "Sold"
  );
  const pendingPayments = bookings.flatMap((booking) =>
    booking.bookingStatus === "Cancelled"
      ? []
      : (booking.payments || [])
          .filter((payment) => payment.verificationStatus === "Pending")
          .map((payment) => ({ booking, payment }))
  );
  const cancelledBookings = bookings.filter(
    (booking) => booking.bookingStatus === "Cancelled"
  );

  const getImageUrl = (property) => {
    const image = property?.image || property?.images?.[0] || "";
    if (!image) return "";
    if (/^https?:\/\//i.test(image)) return image;
    return `${SERVER_URL}${image.startsWith("/") ? "" : "/"}${image}`;
  };

  const updatePaymentVerification = async (paymentId, verificationStatus) => {
    if (!BOOKING_API_ENABLED) return;
    let remarks = "";
    if (verificationStatus === "Rejected") {
      const enteredRemarks = window.prompt(t("Why is this payment being rejected?"));
      if (enteredRemarks === null) return;
      remarks = enteredRemarks.trim();
    }
    setSavingId(paymentId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `${API_URL}/bookings/payments/${paymentId}/verification`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({ verificationStatus, remarks }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          getBookingApiError(response, data, "Unable to update payment.")
        );
      }
      setNotice(data.message);
      await loadBookings();
      onBookingUpdated?.();
    } catch (updateError) {
      console.error("Payment verification error:", updateError);
      setError(updateError.message || "Unable to update payment.");
    } finally {
      setSavingId("");
    }
  };

  const recordPayment = async (event, bookingId) => {
    event.preventDefault();
    if (!BOOKING_API_ENABLED) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    setSavingId(bookingId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          amount: values.get("amount"),
          paymentMethod: values.get("paymentMethod"),
          transactionReference: values.get("transactionReference"),
          paymentDate: values.get("paymentDate"),
          receipt: values.get("receipt"),
          remarks: values.get("remarks"),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          getBookingApiError(response, data, "Unable to record payment.")
        );
      }
      form.reset();
      setNotice(data.message);
      await loadBookings();
      onBookingUpdated?.();
    } catch (saveError) {
      console.error("Record payment error:", saveError);
      setError(saveError.message || "Unable to record payment.");
    } finally {
      setSavingId("");
    }
  };

  const confirmBooking = async (bookingId) => {
    if (!BOOKING_API_ENABLED) return;
    setSavingId(bookingId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          getBookingApiError(response, data, "Unable to confirm booking.")
        );
      }
      setNotice(data.message);
      await loadBookings();
      onBookingUpdated?.();
    } catch (confirmError) {
      console.error("Confirm booking error:", confirmError);
      setError(confirmError.message || "Unable to confirm booking.");
    } finally {
      setSavingId("");
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!BOOKING_API_ENABLED || !window.confirm(t("Cancel this unconfirmed booking and return its property to Available?"))) {
      return;
    }
    setSavingId(bookingId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(getBookingApiError(response, data, "Unable to cancel booking."));
      }
      setNotice(data.message);
      await loadBookings();
      onBookingUpdated?.();
    } catch (cancelError) {
      console.error("Cancel booking error:", cancelError);
      setError(cancelError.message || "Unable to cancel booking.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <section className="booking-management">
      <header className="booking-management-header">
        <div>
          <span>{t("BOOKING & PAYMENT MANAGEMENT")}</span>
          <h1>{t("Bookings and Payments")}</h1>
          <p>{t("Record manual payments, verify receipts, and confirm bookings after the minimum verified advance is met.")}</p>
        </div>
        <button
          type="button"
          onClick={() => loadBookings()}
          disabled={loading || !BOOKING_API_ENABLED}
        >
          {loading
            ? t("Loading...")
            : BOOKING_API_ENABLED
              ? t("Refresh bookings")
              : t("Booking API disabled")}
        </button>
      </header>

      {error && <div className="booking-management-message error" role="alert">{t(error)}</div>}
      {notice && <div className="booking-management-message" role="status">{t(notice)}</div>}
      <section className="sold-records" aria-labelledby="sold-records-title">
        <header className="sold-records-header">
          <div>
            <span>{t("PROPERTY SALES")}</span>
            <h2 id="sold-records-title">{t("Sold Properties & Payment Records")}</h2>
          </div>
          <p>{t("Confirmed bookings and sold properties")}: {soldSummary.properties}</p>
        </header>

        <div className="sold-summary-cards">
          <article><span>{t("Total Sold Properties")}</span><strong>{soldSummary.properties}</strong></article>
          <article><span>{t("Total Property Value")}</span><strong>{formatCurrency(soldSummary.value)}</strong></article>
          <article><span>{t("Total Amount Received")}</span><strong>{formatCurrency(soldSummary.received)}</strong></article>
          <article>
            <span>{t("Total Outstanding Balance")}</span>
            <strong>{formatCurrency(soldSummary.outstanding)}</strong>
            {soldSummary.unknownBalances > 0 && (
              <small>{soldSummary.unknownBalances} {t("sold properties have no linked agreed amount")}</small>
            )}
          </article>
        </div>

        <div className="sold-record-filters">
          <label className="sold-search-filter">{t("Search property, customer, or booking reference")}
            <input
              type="search"
              value={soldSearch}
              onChange={(event) => setSoldSearch(event.target.value)}
              placeholder={t("Search sold records")}
            />
          </label>
          <label>{t("Payment status")}
            <select value={soldPaymentStatus} onChange={(event) => setSoldPaymentStatus(event.target.value)}>
              {["All", "Fully Paid", "Partially Paid", "Pending"].map((status) => (
                <option key={status} value={status}>{t(status)}</option>
              ))}
            </select>
          </label>
          <label>{t("Booking date from")}
            <input type="date" value={bookingDateFrom} onChange={(event) => setBookingDateFrom(event.target.value)} />
          </label>
          <label>{t("Booking date to")}
            <input type="date" value={bookingDateTo} onChange={(event) => setBookingDateTo(event.target.value)} />
          </label>
          <label>{t("Sort by")}
            <select value={soldSort} onChange={(event) => setSoldSort(event.target.value)}>
              <option value="newest">{t("Newest booking")}</option>
              <option value="balance">{t("Highest outstanding balance")}</option>
            </select>
          </label>
        </div>

        {loading ? (
          <p className="booking-management-empty">{t("Loading sold property records...")}</p>
        ) : visibleSoldBookings.length === 0 ? (
          <p className="booking-management-empty">{soldBookings.length ? t("No sold records match these filters.") : t("No confirmed or sold properties found.")}</p>
        ) : (
          <div className="sold-record-list">
            {visibleSoldBookings.map((booking) => {
              const property = booking.property || {};
              const agreedAmount = getAgreedAmount(booking);
              const total = agreedAmount ?? Number(property.price || 0);
              const paid = getVerifiedAmount(booking);
              const balance = agreedAmount === null ? null : Math.max(0, total - paid);
              const progress = agreedAmount > 0 ? Math.min(100, (paid / total) * 100) : null;
              const customerName = booking.buyer?.name || booking.enquiry?.name || "—";
              const customerEmail = booking.buyer?.email || booking.enquiry?.email || "—";
              const customerPhone = booking.buyer?.phone || booking.enquiry?.phone || "—";
              const imageUrl = getImageUrl(property);
              const paymentStatus = getPaymentStatus(booking);

              return (
                <article className="sold-record-card" key={booking._id}>
                  <div className="sold-record-property">
                    {imageUrl ? (
                      <img src={imageUrl} alt={property.title || t("Sold property")} />
                    ) : (
                      <div className="sold-record-image-placeholder">{t("No image")}</div>
                    )}
                    <div>
                      <span className="booking-reference">{booking.bookingReference || t("No linked booking")}</span>
                      <h3>{property.title || booking.enquiry?.propertyTitle || t("Property booking")}</h3>
                      <p>{property.location || "—"}</p>
                    </div>
                    <span className={`sold-payment-status sold-payment-status-${paymentStatus.toLowerCase().replace(/\s+/g, "-")}`}>
                      {t(paymentStatus)}
                    </span>
                  </div>

                  <div className="sold-record-details">
                    <dl>
                      <div><dt>{t("Customer")}</dt><dd>{customerName}</dd></div>
                      <div><dt>{t("Email")}</dt><dd>{customerEmail}</dd></div>
                      <div><dt>{t("Phone")}</dt><dd>{customerPhone}</dd></div>
                      <div><dt>{t("Property purchased")}</dt><dd>{property.title || booking.enquiry?.propertyTitle || t("Property booking")}</dd></div>
                      <div><dt>{t("Booking reference")}</dt><dd>{booking.bookingReference || "—"}</dd></div>
                      <div><dt>{t("Booking date")}</dt><dd>{formatDate(booking.createdAt)}</dd></div>
                      <div><dt>{t("Booking confirmation date")}</dt><dd>{formatDate(booking.confirmedAt)}</dd></div>
                    </dl>
                    <div className="sold-payment-summary">
                      <div><span>{t(booking.isUnlinkedSoldProperty ? "Property price (no linked booking)" : "Total Amount")}</span><strong>{formatCurrency(total)}</strong></div>
                      <div><span>{t("Total Paid")}</span><strong>{formatCurrency(paid)}</strong></div>
                      <div><span>{t("Remaining Balance")}</span><strong>{balance === null ? "—" : formatCurrency(balance)}</strong></div>
                      <div className="sold-progress">
                        <div><span>{t("Payment Progress")}</span><strong>{progress === null ? "—" : `${progress.toFixed(1)}%`}</strong></div>
                        {progress !== null && <progress value={progress} max="100" aria-label={`${progress.toFixed(1)}% ${t("paid")}`} />}
                      </div>
                    </div>
                  </div>

                  <details className="sold-payment-history">
                    <summary>{t("Payment history")} ({booking.payments?.length || 0})</summary>
                    <div className="sold-payment-table-wrap">
                      <table>
                        <thead><tr>
                          <th>{t("Payment date")}</th>
                          <th>{t("Amount")}</th>
                          <th>{t("Payment method")}</th>
                          <th>{t("Transaction reference")}</th>
                          <th>{t("Verification status")}</th>
                        </tr></thead>
                        <tbody>
                          {booking.payments?.length ? booking.payments.map((payment) => (
                            <tr key={payment._id}>
                              <td>{formatDate(payment.paymentDate)}</td>
                              <td>{formatCurrency(payment.amount)}</td>
                              <td>{t(payment.paymentMethod || "—")}</td>
                              <td>{payment.transactionReference || "—"}</td>
                              <td><span className={`sold-payment-status sold-payment-status-${String(payment.verificationStatus || "pending").toLowerCase()}`}>
                                {t(payment.verificationStatus || "Pending")}
                              </span></td>
                            </tr>
                          )) : (
                            <tr><td colSpan="5">{t("No payment entries.")}</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {!BOOKING_API_ENABLED && (
        <p className="booking-management-empty" role="status">
          {t("Booking and payment management is disabled until the updated backend is deployed. Then set VITE_BOOKING_API_ENABLED=true in the frontend deployment and redeploy.")}
        </p>
      )}
      {BOOKING_API_ENABLED && bookingApiStatus !== "missing" && (
        <section className="payment-verification-section" aria-labelledby="payment-verification-title">
          <header className="booking-section-header">
            <h2 id="payment-verification-title">{t("Payment Verification")}</h2>
            <span>{pendingPayments.length} {t("pending payments")}</span>
          </header>
          {pendingPayments.length === 0 ? (
            <p className="booking-management-empty">{t("No payments are waiting for verification.")}</p>
          ) : (
            <div className="payment-verification-list">
              {pendingPayments.map(({ booking, payment }) => (
                <article className="payment-verification-item" key={payment._id}>
                  <div>
                    <strong>{booking.property?.title || booking.enquiry?.propertyTitle || t("Property booking")}</strong>
                    <span>{booking.bookingReference} · {booking.buyer?.name || booking.enquiry?.name || "—"}</span>
                    <span>{formatDate(payment.paymentDate)} · {t(payment.paymentMethod)} · {payment.transactionReference || t("No transaction reference")}</span>
                  </div>
                  <strong>{formatCurrency(payment.amount)}</strong>
                  <div className="booking-payment-actions">
                    <button
                      type="button"
                      disabled={Boolean(savingId)}
                      onClick={() => updatePaymentVerification(payment._id, "Verified")}
                    >{t("Verify")}</button>
                    <button
                      type="button"
                      className="booking-reject-button"
                      disabled={Boolean(savingId)}
                      onClick={() => updatePaymentVerification(payment._id, "Rejected")}
                    >{t("Reject")}</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
      <header className="booking-section-header active-bookings-heading">
        <h2>{t("Active Bookings")}</h2>
        <span>{activeBookings.length}</span>
      </header>
      {loading ? (
        <p className="booking-management-empty">{t("Loading bookings...")}</p>
      ) : !BOOKING_API_ENABLED ? null : (
        bookingApiStatus === "unchecked" && !error ? (
          <p className="booking-management-empty">
            {t("Select “Refresh bookings” to load bookings.")}
          </p>
        ) : bookingApiStatus === "missing" ? (
          <p className="booking-management-empty" role="status">
            {t("Deploy the updated backend to enable booking and payment management, then refresh bookings.")}
          </p>
        ) : activeBookings.length === 0 ? (
          <p className="booking-management-empty">{t("No active bookings. Customer-accepted offers will be available to initiate from User Enquiries.")}</p>
        ) : (
          <div className="booking-management-list">
            {activeBookings.map((booking) => {
              const paid = getVerifiedAmount(booking);
              const minimum = Number((Number(booking.agreedAmount || 0) * 0.1).toFixed(2));
              const balance = Math.max(0, Number(booking.agreedAmount || 0) - paid);
              const progress = booking.agreedAmount > 0
                ? Math.min(100, (paid / booking.agreedAmount) * 100)
                : 0;
              const canConfirm =
                booking.bookingStatus !== "Confirmed" &&
                booking.bookingStatus !== "Cancelled" &&
                paid + 0.005 >= minimum;
              return (
                <article className="booking-management-card" key={booking._id}>
                  <header className="booking-management-card-header">
                    <div>
                      <span className="booking-reference">{booking.bookingReference}</span>
                      <h2>{booking.property?.title || booking.enquiry?.propertyTitle || t("Property booking")}</h2>
                      <p>{booking.property?.location || "—"}</p>
                    </div>
                    <span className={`booking-status booking-status-${String(booking.bookingStatus).toLowerCase().replace(/\s+/g, "-")}`}>
                      {t(booking.bookingStatus)}
                    </span>
                  </header>

                  <div className="booking-management-summary">
                    <p><strong>{t("Customer")}:</strong> {booking.buyer?.name || booking.enquiry?.name || "—"}</p>
                    <p><strong>{t("Email")}:</strong> {booking.buyer?.email || booking.enquiry?.email || "—"}</p>
                    <p><strong>{t("Phone")}:</strong> {booking.buyer?.phone || booking.enquiry?.phone || "—"}</p>
                    {booking.enquiry?.propertyOffer && (
                      <p><strong>{t("Accepted offer")}:</strong> {booking.enquiry.propertyOffer.title || formatCurrency(booking.enquiry.propertyOffer.amount)}</p>
                    )}
                    <p><strong>{t("Booking date")}:</strong> {formatDate(booking.createdAt)}</p>
                    <p><strong>{t("Confirmation date")}:</strong> {formatDate(booking.confirmedAt)}</p>
                    <p><strong>{t("Agreed amount")}:</strong> {formatCurrency(booking.agreedAmount)}</p>
                    <p><strong>{t("Verified payments")}:</strong> {formatCurrency(paid)}</p>
                    <p><strong>{t("Minimum to confirm (10%)")}:</strong> {formatCurrency(minimum)}</p>
                    <p><strong>{t("Balance")}:</strong> {formatCurrency(balance)}</p>
                    <p><strong>{t("Payment progress")}:</strong> {progress.toFixed(1)}%</p>
                  </div>

                  <div className="booking-payment-list">
                    <h3>{t("Payment history")}</h3>
                    {booking.payments?.length ? booking.payments.map((payment) => (
                      <div className="booking-payment-row" key={payment._id}>
                        <div>
                          <strong>{formatCurrency(payment.amount)} · {t(payment.paymentMethod)}</strong>
                          <span>{formatDate(payment.paymentDate)} · {t(payment.verificationStatus)}</span>
                          {payment.transactionReference && <small>{t("Reference")}: {payment.transactionReference}</small>}
                          {payment.receipt && (
                            <a href={payment.receipt} target="_blank" rel="noopener noreferrer">
                              {t("View receipt")}
                            </a>
                          )}
                          {payment.remarks && <small>{t("Admin remarks")}: {payment.remarks}</small>}
                        </div>
                      </div>
                    )) : <p className="booking-management-muted">{t("No payment entries.")}</p>}
                  </div>

                  {booking.bookingStatus !== "Confirmed" && booking.bookingStatus !== "Cancelled" && (
                    <>
                      <form className="booking-payment-form" onSubmit={(event) => recordPayment(event, booking._id)}>
                        <h3>{t("Record a manual payment")}</h3>
                        <label>{t("Amount (₹)")}<input name="amount" type="number" min="0.01" step="0.01" required /></label>
                        <label>{t("Payment method")}
                          <select name="paymentMethod" required defaultValue="Bank Transfer">
                            {["Cash", "Bank Transfer", "UPI", "Cheque", "Other"].map((method) => (
                              <option key={method} value={method}>{t(method)}</option>
                            ))}
                          </select>
                        </label>
                        <label>{t("Payment date")}<input name="paymentDate" type="date" max={new Date().toISOString().slice(0, 10)} defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
                        <label>{t("Transaction reference")}<input name="transactionReference" type="text" maxLength="120" /></label>
                        <label>{t("Receipt URL (optional)")}<input name="receipt" type="url" maxLength="1000" /></label>
                        <label className="booking-payment-form-wide">{t("Private admin remarks")}<textarea name="remarks" maxLength="1000" rows="2" /></label>
                        <button type="submit" disabled={Boolean(savingId)}>{savingId === booking._id ? t("Saving...") : t("Record for verification")}</button>
                      </form>
                      <div className="booking-confirm-row">
                        <p>{canConfirm
                          ? t("The 10% verified payment requirement is met.")
                          : t("Verify payments totaling at least 10% before confirming.")}</p>
                        <div className="booking-confirm-actions">
                          <button type="button" disabled={!canConfirm || Boolean(savingId)} onClick={() => confirmBooking(booking._id)}>
                            {t("Confirm booking")}
                          </button>
                          <button type="button" className="booking-cancel-button" disabled={Boolean(savingId)} onClick={() => cancelBooking(booking._id)}>
                            {t("Cancel booking")}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )
      )}
      {cancelledBookings.length > 0 && (
        <details className="cancelled-booking-history">
          <summary>{t("Cancelled booking history")} ({cancelledBookings.length})</summary>
          <div className="cancelled-booking-list">
            {cancelledBookings.map((booking) => (
              <article key={booking._id}>
                <div>
                  <strong>{booking.bookingReference} · {booking.property?.title || booking.enquiry?.propertyTitle || t("Property booking")}</strong>
                  <span>{booking.buyer?.name || booking.enquiry?.name || "—"} · {formatDate(booking.updatedAt)}</span>
                  <span>{t("Agreed amount")}: {formatCurrency(booking.agreedAmount)}</span>
                </div>
                <details>
                  <summary>{t("Payment history")} ({booking.payments?.length || 0})</summary>
                  {(booking.payments || []).map((payment) => (
                    <p key={payment._id}>
                      {formatDate(payment.paymentDate)} · {formatCurrency(payment.amount)} · {t(payment.paymentMethod)} · {t(payment.verificationStatus)}
                      {payment.transactionReference ? ` · ${payment.transactionReference}` : ""}
                      {payment.remarks ? ` · ${t("Admin remarks")}: ${payment.remarks}` : ""}
                    </p>
                  ))}
                </details>
              </article>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

export default BookingManagement;
