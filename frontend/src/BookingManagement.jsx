import { useCallback, useState } from "react";
import { API_URL, BOOKING_API_ENABLED } from "./apiConfig";
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

const getBookingApiError = (response, data, fallback) =>
  response.status === 404
    ? "Booking and payment APIs are missing from the deployed backend. Deploy the updated backend, then refresh this page."
    : data.message || fallback;

function BookingManagement({ onBookingUpdated }) {
  const { t } = useLocale();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState("");
  const [bookingApiStatus, setBookingApiStatus] = useState("unchecked");

  const loadBookings = useCallback(async (showLoading = true) => {
    if (!BOOKING_API_ENABLED) return;
    if (showLoading) setLoading(true);
    setError("");
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
      {!BOOKING_API_ENABLED && (
        <p className="booking-management-empty" role="status">
          {t("Booking and payment management is disabled until the updated backend is deployed. Then set VITE_BOOKING_API_ENABLED=true in the frontend deployment and redeploy.")}
        </p>
      )}
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
        ) : bookings.length === 0 ? (
          <p className="booking-management-empty">{t("No bookings yet. Customer-accepted offers will be available to initiate from User Enquiries.")}</p>
        ) : (
          <div className="booking-management-list">
            {bookings.map((booking) => {
              const paid = Number(booking.verifiedAmount || 0);
              const minimum = Number((Number(booking.agreedAmount || 0) * 0.1).toFixed(2));
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
                    <p><strong>{t("Agreed amount")}:</strong> {formatCurrency(booking.agreedAmount)}</p>
                    <p><strong>{t("Verified payments")}:</strong> {formatCurrency(paid)}</p>
                    <p><strong>{t("Minimum to confirm (10%)")}:</strong> {formatCurrency(minimum)}</p>
                    <p><strong>{t("Balance")}:</strong> {formatCurrency(Math.max(0, booking.agreedAmount - paid))}</p>
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
                        {payment.verificationStatus === "Pending" && (
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
                        )}
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
                        <button type="button" disabled={!canConfirm || Boolean(savingId)} onClick={() => confirmBooking(booking._id)}>
                          {t("Confirm booking")}
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )
      )}
    </section>
  );
}

export default BookingManagement;
