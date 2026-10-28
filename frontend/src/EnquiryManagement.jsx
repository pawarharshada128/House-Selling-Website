import React, { useMemo, useState } from "react";
import { useLocale } from "./LocaleContext";
import { isBuildLandRequest, isPropertyEnquiry } from "./enquiryUtils";

const USER_STATUSES = [
  "Pending",
  "New",
  "Contacted",
  "Visit Scheduled",
  "Site Visit Scheduled",
  "Offer Made",
  "Quotation Sent",
  "Booking in Progress",
  "Booking Confirmed",
  "Rejected",
  "In Progress",
  "Completed",
  "Closed",
  "Cancelled",
];

const BUILD_STATUSES = [
  "Pending",
  "New",
  "Contacted",
  "Site Visit Scheduled",
  "Quotation in Preparation",
  "Quotation Sent",
  "Approved",
  "In Progress",
  "Completed",
  "Rejected",
  "Cancelled",
  "Closed",
];

const isActiveConstructionRequest = (enquiry) =>
  ["Site Visit Scheduled", "Quotation in Preparation", "Quotation Sent", "Approved", "In Progress"]
    .includes(enquiry.status);

const getWhatsAppNumber = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }
  return digits.length >= 11 ? digits : "";
};

const getBuildDetails = (enquiry) => {
  const details = enquiry.buildDetails || {};
  const legacy = {};
  const fields = [
    ["landLocation", /^land location:\s*(.*)$/i],
    ["plotArea", /^land area:\s*(.*)$/i],
    ["budget", /^estimated budget:\s*(.*)$/i],
    ["homeType", /^preferred (?:home|house) type:\s*(.*)$/i],
    ["homeSize", /^preferred home size:\s*(.*)$/i],
    ["floors", /^number of floors:\s*(.*)$/i],
    ["bedrooms", /^bedrooms:\s*(.*)$/i],
    ["preferredDesign", /^preferred design:\s*(.*)$/i],
    ["additionalRequirements", /^additional details:\s*(.*)$/i],
  ];

  String(enquiry.message || "").split(/\r?\n/).forEach((line) => {
    fields.forEach(([key, expression]) => {
      const match = line.match(expression);
      if (match) legacy[key] = match[1].trim();
    });
  });

  const savedDetails = Object.fromEntries(
    Object.entries(details).filter(([, value]) => String(value || "").trim())
  );
  return { ...legacy, ...savedDetails };
};

const formatDate = (value, locale, includeTime = false) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(locale, includeTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" });
};

const toDateTimeLocal = (value = new Date()) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const toISOStringFromLocal = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const getImageUrl = (image) => {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  const baseUrl = "https://house-selling-website.onrender.com";
  return `${baseUrl}${image.startsWith("/") ? "" : "/"}${image}`;
};

function ContactActions({ enquiry, isBuildRequest, t }) {
  const whatsappNumber = getWhatsAppNumber(enquiry.phone);
  const subject = encodeURIComponent(
    isBuildRequest
      ? t("Your Build Your Dream Home request")
      : `${t("Your enquiry about")} ${enquiry.propertyTitle || enquiry.propertyId?.title || t("property")}`
  );
  const body = encodeURIComponent(
    `${t("Hi")} ${enquiry.name || t("there")},\n\n${t("Thank you for contacting Shree Krishna Constructions. We would be happy to discuss your requirements.")}\n\n${t("Regards")},\n${t("Shree Krishna Constructions")}`
  );

  return (
    <div className="request-contact-actions">
      {enquiry.phone && (
        <a className="enquiry-reply-link call" href={`tel:${String(enquiry.phone).replace(/[^\d+]/g, "")}`}>
          {t("Call Customer")}
        </a>
      )}
      {enquiry.email && (
        <a className="enquiry-reply-link email" href={`mailto:${encodeURIComponent(enquiry.email)}?subject=${subject}&body=${body}`}>
          {t("Send Email")}
        </a>
      )}
      {whatsappNumber && (
        <a className="enquiry-reply-link whatsapp" href={`https://wa.me/${whatsappNumber}?text=${body}`} target="_blank" rel="noopener noreferrer">
          {t("WhatsApp")}
        </a>
      )}
    </div>
  );
}

function AdminNotes({ enquiry, onSave, saving, t, language }) {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const saved = await onSave(enquiry._id, {
      adminNote: formData.get("adminNote"),
    });
    if (saved) form.reset();
  };

  return (
    <details className="request-history">
      <summary>{t("Internal Admin Notes")} ({enquiry.adminNotes?.length || 0})</summary>
      {(enquiry.adminNotes || []).map((entry, index) => (
        <p key={`${entry.createdAt}-${index}`}>
          {entry.note}
          <small> · {formatDate(entry.createdAt, language, true)}</small>
        </p>
      ))}
      <form className="request-management-form" onSubmit={handleSubmit}>
        <label>
          {t("Add internal note")}
          <textarea name="adminNote" rows="2" maxLength="1000" required />
        </label>
        <button type="submit" className="enquiry-management-save" disabled={saving}>
          {saving ? t("Saving...") : t("Save Note")}
        </button>
      </form>
    </details>
  );
}

function VisitHistory({ enquiry, onSave, saving, t, language, title }) {
  const [editingVisitId, setEditingVisitId] = useState("");

  const handleUpdate = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const saved = await onSave(enquiry._id, {
      siteVisitUpdate: {
        visitId: data.get("visitId"),
        scheduledAt: toISOStringFromLocal(data.get("scheduledAt")),
        location: data.get("location"),
        instructions: data.get("instructions"),
        notes: data.get("notes"),
        status: data.get("status"),
      },
    });
    if (saved) setEditingVisitId("");
  };

  if (!enquiry.siteVisits?.length) return null;

  return (
    <div className="request-history">
      <h3>{t(title)}</h3>
      {enquiry.siteVisits.map((visit) => (
        <div className="request-visit-item" key={visit._id || visit.scheduledAt}>
          <p>
            <strong>{formatDate(visit.scheduledAt, language, true)} · {t(visit.status || "Scheduled")}</strong>
            {visit.location && ` · ${visit.location}`}
            {visit.notes && ` · ${visit.notes}`}
            {visit.instructions && ` · ${visit.instructions}`}
          </p>
          {editingVisitId === visit._id ? (
            <form className="request-management-form" onSubmit={handleUpdate}>
              <input type="hidden" name="visitId" value={visit._id} />
              <label>{t("Visit date and time")}<input name="scheduledAt" type="datetime-local" defaultValue={toDateTimeLocal(visit.scheduledAt)} required /></label>
              <label>{t("Meeting location")}<input name="location" type="text" maxLength="300" defaultValue={visit.location || ""} /></label>
              <label>{t("Instructions")}<textarea name="instructions" rows="2" maxLength="1000" defaultValue={visit.instructions || ""} /></label>
              <label>{t("Visit notes")}<textarea name="notes" rows="2" maxLength="1000" defaultValue={visit.notes || ""} /></label>
              <label>{t("Visit status")}
                <select name="status" defaultValue={visit.status || "Scheduled"}>
                  {["Scheduled", "Completed", "Cancelled"].map((status) => (
                    <option value={status} key={status}>{t(status)}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="enquiry-management-save" disabled={saving}>{t("Save Visit")}</button>
              <button type="button" className="view-action" onClick={() => setEditingVisitId("")}>{t("Cancel")}</button>
            </form>
          ) : (
            <button
              type="button"
              className="edit-action"
              disabled={saving}
              onClick={() => setEditingVisitId(visit._id)}
            >
              {t("Edit Visit")}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function PropertyEnquiryCard({
  enquiry,
  onDelete,
  onSave,
  onStatusChange,
  saving,
  t,
  language,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState(Number(enquiry.propertyOffer?.amount || 0));
  const [offerDiscountAmount, setOfferDiscountAmount] = useState(Number(enquiry.propertyOffer?.discountAmount || 0));
  const [offerDiscountPercent, setOfferDiscountPercent] = useState(Number(enquiry.propertyOffer?.discountPercent || 0));
  const property = enquiry.propertyId && typeof enquiry.propertyId === "object"
    ? enquiry.propertyId
    : null;
  const image = property?.image || property?.images?.[0];
  const canMakeOffer =
    enquiry.requestType === "PropertyBooking" ||
    enquiry.type === "PropertyBooking" ||
    (!enquiry.requestType && !enquiry.type && Boolean(enquiry.propertyId));
  const nextScheduledVisit = enquiry.siteVisits?.find((visit) => visit.status === "Scheduled");
  const statusOptions = USER_STATUSES.includes(enquiry.status)
    ? USER_STATUSES
    : [enquiry.status, ...USER_STATUSES].filter(Boolean);

  const handleVisitSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const saved = await onSave(enquiry._id, {
      siteVisit: {
        scheduledAt: toISOStringFromLocal(data.get("scheduledAt")),
        notes: data.get("notes"),
        location: data.get("location"),
        instructions: data.get("instructions"),
        visitType: "Property Visit",
      },
      status: "Visit Scheduled",
    });
    if (saved) {
      form.reset();
      setVisitOpen(false);
    }
  };

  const handleOfferSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const saved = await onSave(enquiry._id, {
      propertyOffer: {
        amount: data.get("amount"),
        title: data.get("title"),
        discountAmount: data.get("discountAmount"),
        discountPercent: data.get("discountPercent"),
        validUntil: data.get("validUntil") || null,
        details: data.get("details"),
        status: data.get("offerStatus"),
      },
      ...(data.get("offerStatus") === "Sent" ? { status: "Offer Made" } : {}),
    });
    if (saved) {
      setOfferAmount(Number(data.get("amount") || 0));
      setOfferDiscountAmount(Number(data.get("discountAmount") || 0));
      setOfferDiscountPercent(Number(data.get("discountPercent") || 0));
      setOfferOpen(false);
    }
  };

  return (
    <article className="customer-request-card">
      <div className="customer-request-card-header">
        <div className="customer-request-customer">
          <strong>{enquiry.name}</strong>
          <span>{enquiry.email}</span>
          <span>{enquiry.phone}</span>
          <span>{t("Reference ID")}: <code>{enquiry._id}</code></span>
        </div>
        <div className="customer-request-status">
          <span className={`enquiry-status-badge ${String(enquiry.status || "Pending").toLowerCase().replaceAll(" ", "-")}`}>
            {t(enquiry.status || "Pending")}
          </span>
          <label>
            {t("Enquiry / Booking Status")}
            <select
              value={enquiry.status || "New"}
              onChange={(event) => onStatusChange(enquiry._id, event.target.value)}
              disabled={saving}
            >
              {statusOptions.map((status) => (
                <option value={status} key={status}>{t(status)}</option>
              ))}
            </select>
          </label>
          <small>{t("Submitted")}: {formatDate(enquiry.createdAt, language)}</small>
          <small>{t("Latest update")}: {formatDate(enquiry.updatedAt, language, true)}</small>
        </div>
      </div>

      <div className="property-enquiry-information">
        {image && (
          <img src={getImageUrl(image)} alt={property?.title || enquiry.propertyTitle || t("Property")} />
        )}
        <div>
          <strong>{property?.title || enquiry.propertyTitle || t("Property details unavailable")}</strong>
          <span>{property?.location || t("Location unavailable")}</span>
          {property?.property_type && <span>{t(property.property_type)}</span>}
          {property?.price !== undefined && (
            <b>₹{Number(property.price).toLocaleString("en-IN")}</b>
          )}
        </div>
      </div>

      <div className="customer-request-message">
        <strong>{t("Enquiry Message")}</strong>
        <p>{enquiry.message}</p>
      </div>
      {nextScheduledVisit && (
        <p className="enquiry-management-meta">
          <strong>{t("Next property visit")}:</strong> {formatDate(nextScheduledVisit.scheduledAt, language, true)}
          {nextScheduledVisit.location ? ` · ${nextScheduledVisit.location}` : ""}
        </p>
      )}

      <ContactActions enquiry={enquiry} isBuildRequest={false} t={t} />

      <div className="customer-request-actions">
        <button type="button" className="view-action" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((open) => !open)}>
          {detailsOpen ? t("Hide Details") : t("View Details")}
        </button>
        <button type="button" className="edit-action" disabled={saving} onClick={() => setVisitOpen((open) => !open)}>
          {t("Schedule Property Visit")}
        </button>
        {canMakeOffer && (
          <button type="button" className="edit-action" disabled={saving} onClick={() => setOfferOpen((open) => !open)}>
            {enquiry.propertyOffer ? t("Update Property Offer") : t("Add Property Offer")}
          </button>
        )}
        {enquiry.status !== "Closed" && (
          <button type="button" className="edit-action" disabled={saving} onClick={() => onStatusChange(enquiry._id, "Closed")}>
            {t("Close Enquiry")}
          </button>
        )}
        <button type="button" className="delete-btn" disabled={saving} onClick={() => {
          if (window.confirm(t("Delete this enquiry? This action cannot be undone."))) onDelete(enquiry._id);
        }}>
          {t("Delete Enquiry")}
        </button>
      </div>

      <AdminNotes enquiry={enquiry} onSave={onSave} saving={saving} t={t} language={language} />

      {enquiry.propertyOffer && (
        <details className="request-history">
          <summary>{t("Property Offer")} · {t(enquiry.propertyOffer.status)}</summary>
          <div className="request-visit-item">
            {enquiry.propertyOffer.title && <p><strong>{enquiry.propertyOffer.title}</strong></p>}
            <p><strong>{t("Offer amount")}:</strong> ₹{Number(enquiry.propertyOffer.amount || 0).toLocaleString("en-IN")}</p>
            {Number(enquiry.propertyOffer.discountAmount) > 0 && <p>{t("Discount amount")}: ₹{Number(enquiry.propertyOffer.discountAmount).toLocaleString("en-IN")}</p>}
            {Number(enquiry.propertyOffer.discountPercent) > 0 && <p>{t("Discount percentage")}: {enquiry.propertyOffer.discountPercent}%</p>}
            <p><strong>{t("Calculated final amount")}:</strong> ₹{Math.max(0,
              Number(enquiry.propertyOffer.amount || 0) -
              Number(enquiry.propertyOffer.discountAmount || 0) -
              Number(enquiry.propertyOffer.amount || 0) * Number(enquiry.propertyOffer.discountPercent || 0) / 100
            ).toLocaleString("en-IN")}</p>
            {enquiry.propertyOffer.details && <p>{enquiry.propertyOffer.details}</p>}
            {enquiry.propertyOffer.validUntil && <p>{t("Valid until")}: {formatDate(enquiry.propertyOffer.validUntil, language)}</p>}
          </div>
        </details>
      )}

      {detailsOpen && (
        <div className="request-detail-panel">
          <h3>{t("Property Enquiry Details")}</h3>
          <p><strong>{t("Property")}: </strong>{property?.title || enquiry.propertyTitle || "—"}</p>
          <p><strong>{t("Location")}: </strong>{property?.location || "—"}</p>
          <p><strong>{t("Price")}: </strong>{property?.price === undefined ? "—" : `₹${Number(property.price).toLocaleString("en-IN")}`}</p>
          {property?.description && <p><strong>{t("Description")}: </strong>{property.description}</p>}
          <p><strong>{t("Message")}: </strong>{enquiry.message}</p>
        </div>
      )}

      {visitOpen && (
        <form className="request-management-form" onSubmit={handleVisitSubmit}>
          <h3>{t("Schedule Property Visit")}</h3>
          <label>{t("Visit date and time")}<input name="scheduledAt" type="datetime-local" min={toDateTimeLocal()} required /></label>
          <label>{t("Meeting location")}<input name="location" type="text" maxLength="300" /></label>
          <label>{t("Instructions")}<textarea name="instructions" rows="2" maxLength="1000" /></label>
          <label>{t("Visit notes")}<textarea name="notes" rows="2" maxLength="1000" /></label>
          <button type="submit" className="enquiry-management-save" disabled={saving}>{t("Save Visit")}</button>
        </form>
      )}

      {offerOpen && canMakeOffer && (
        <form className="request-management-form" onSubmit={handleOfferSubmit}>
          <h3>{t("Property Offer")}</h3>
          <label>{t("Offer title")}<input name="title" type="text" maxLength="120" defaultValue={enquiry.propertyOffer?.title || ""} /></label>
          <label>{t("Offer amount (₹)")}<input name="amount" type="number" min="0" step="0.01" value={offerAmount || ""} onChange={(event) => setOfferAmount(Number(event.target.value) || 0)} required /></label>
          <div className="request-management-form-grid">
            <label>{t("Discount amount (₹)")}<input name="discountAmount" type="number" min="0" step="0.01" value={offerDiscountAmount} onChange={(event) => setOfferDiscountAmount(Number(event.target.value) || 0)} /></label>
            <label>{t("Discount percentage")}<input name="discountPercent" type="number" min="0" max="100" step="0.01" value={offerDiscountPercent} onChange={(event) => setOfferDiscountPercent(Number(event.target.value) || 0)} /></label>
          </div>
          <p className="enquiry-management-meta">{t("Calculated final amount")}: ₹{Math.max(0,
            offerAmount - offerDiscountAmount - offerAmount * offerDiscountPercent / 100
          ).toLocaleString("en-IN")}</p>
          <label>{t("Offer valid until")}<input name="validUntil" type="date" defaultValue={enquiry.propertyOffer?.validUntil ? new Date(enquiry.propertyOffer.validUntil).toISOString().slice(0, 10) : ""} /></label>
          <label>{t("Offer details")}<textarea name="details" rows="2" maxLength="2000" defaultValue={enquiry.propertyOffer?.details || ""} /></label>
          <label>{t("Offer status")}
            <select name="offerStatus" defaultValue={enquiry.propertyOffer?.status || "Draft"}>
              {["Draft", "Sent", "Accepted", "Rejected"].map((status) => <option value={status} key={status}>{t(status)}</option>)}
            </select>
          </label>
          <button type="submit" className="enquiry-management-save" disabled={saving}>{saving ? t("Saving...") : t("Save Offer")}</button>
          {enquiry.propertyOffer && (
            <p className="enquiry-management-meta">
              {t("Last updated")}: {formatDate(enquiry.propertyOffer.updatedAt, language, true)}
              {enquiry.email && (
                <> · <a href={`mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(t("Property offer"))}&body=${encodeURIComponent(`${t("Offer amount")}: ₹${Number(enquiry.propertyOffer.amount).toLocaleString("en-IN")}\n${enquiry.propertyOffer.details || ""}`)}`}>{t("Email Offer")}</a></>
              )}
            </p>
          )}
        </form>
      )}

      {enquiry.siteVisits?.length > 0 && (
        <details className="request-history">
          <summary>{t("Property Visit History")} ({enquiry.siteVisits.length})</summary>
          <VisitHistory
            enquiry={enquiry}
            onSave={onSave}
            saving={saving}
            t={t}
            language={language}
            title="Property Visit History"
          />
        </details>
      )}
    </article>
  );
}

function BuildRequestCard({
  enquiry,
  onDelete,
  onSave,
  onStatusChange,
  saving,
  t,
  language,
}) {
  const [requirementsOpen, setRequirementsOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressDateError, setProgressDateError] = useState("");
  const [quotationTotal, setQuotationTotal] = useState(
    Number(enquiry.quotation?.materialCost || 0) +
    Number(enquiry.quotation?.labourCost || 0) +
    Number(enquiry.quotation?.additionalCharges || 0)
  );
  const details = getBuildDetails(enquiry);
  const nextScheduledVisit = enquiry.siteVisits?.find((visit) => visit.status === "Scheduled");
  const statusOptions = BUILD_STATUSES.includes(enquiry.status)
    ? BUILD_STATUSES
    : [enquiry.status, ...BUILD_STATUSES].filter(Boolean);
  const progress = [...(enquiry.progressUpdates || [])].sort(
    (a, b) =>
      new Date(a.updateDate || a.createdAt || 0) -
      new Date(b.updateDate || b.createdAt || 0)
  );
  const updateQuotationTotal = (event) => {
    const form = event.currentTarget.form;
    setQuotationTotal(
      Number(form.elements.materialCost.value || 0) +
      Number(form.elements.labourCost.value || 0) +
      Number(form.elements.additionalCharges.value || 0)
    );
  };

  const handleVisitSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const saved = await onSave(enquiry._id, {
      siteVisit: {
        scheduledAt: toISOStringFromLocal(data.get("scheduledAt")),
        notes: data.get("notes"),
        location: data.get("location"),
        instructions: data.get("instructions"),
        visitType: "Land Inspection",
      },
      status: "Site Visit Scheduled",
    });
    if (saved) {
      form.reset();
      setVisitOpen(false);
    }
  };

  const handleQuotationSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const quotationStatus = data.get("quotationStatus");
    const enquiryStatus = {
      Sent: "Quotation Sent",
      Accepted: "Approved",
      Rejected: "Rejected",
    }[quotationStatus] || "Quotation in Preparation";

    const saved = await onSave(enquiry._id, {
      quotation: {
        amount: quotationTotal,
        reference: data.get("reference"),
        description: data.get("description"),
        materialCost: data.get("materialCost"),
        labourCost: data.get("labourCost"),
        additionalCharges: data.get("additionalCharges"),
        quotedAt: data.get("quotedAt"),
        validUntil: data.get("validUntil") || null,
        details: data.get("details"),
        status: quotationStatus,
      },
      status: enquiryStatus,
    });
    if (saved) {
      setQuotationTotal(
        Number(data.get("materialCost") || 0) +
        Number(data.get("labourCost") || 0) +
        Number(data.get("additionalCharges") || 0)
      );
      setQuotationOpen(false);
    }
  };

  const handleProgressSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const startDate = data.get("startDate");
    const targetDate = data.get("targetCompletionDate");
    const actualDate = data.get("actualCompletionDate");
    const progressNumber = Number(data.get("progress"));
    if (!Number.isFinite(progressNumber) || progressNumber < 0 || progressNumber > 100) {
      setProgressDateError(t("Completion percentage must be between 0 and 100."));
      return;
    }
    if ((startDate && targetDate && startDate > targetDate) ||
      (actualDate && startDate && actualDate < startDate)) {
      setProgressDateError(t("Check milestone dates: the target must follow the start date and actual completion cannot precede it."));
      return;
    }
    setProgressDateError("");
    const saved = await onSave(enquiry._id, {
      progressUpdate: {
        title: data.get("milestone"),
        updateDate: data.get("updateDate"),
        startDate: data.get("startDate") || null,
        targetCompletionDate: data.get("targetCompletionDate") || null,
        actualCompletionDate: data.get("actualCompletionDate") || null,
        description: data.get("description"),
        progress: data.get("progress"),
        status: data.get("milestoneStatus"),
        remarks: data.get("remarks"),
      },
    });
    if (saved) {
      form.reset();
      setProgressValue(0);
      setProgressDateError("");
      setProgressOpen(false);
    }
  };

  return (
    <article className="customer-request-card">
      <div className="customer-request-card-header">
        <div className="customer-request-customer">
          <strong>{enquiry.name}</strong>
          <span>{enquiry.email}</span>
          <span>{enquiry.phone}</span>
          <span>{t("Reference ID")}: <code>{enquiry._id}</code></span>
        </div>
        <div className="customer-request-status">
          <span className={`enquiry-status-badge ${String(enquiry.status || "Pending").toLowerCase().replaceAll(" ", "-")}`}>
            {t(enquiry.status || "Pending")}
          </span>
          <label>
            {t("Construction Status")}
            <select
              value={enquiry.status || "New"}
              onChange={(event) => onStatusChange(enquiry._id, event.target.value)}
              disabled={saving}
            >
              {statusOptions.map((status) => <option value={status} key={status}>{t(status)}</option>)}
            </select>
          </label>
          <small>{t("Submitted")}: {formatDate(enquiry.createdAt, language)}</small>
          <small>{t("Latest update")}: {formatDate(enquiry.updatedAt, language, true)}</small>
        </div>
      </div>

      <div className="build-requirements-summary">
        <span><strong>{t("Land location")}</strong>{details.landLocation || "—"}</span>
        <span><strong>{t("Plot area")}</strong>{details.plotArea || "—"}</span>
        <span><strong>{t("House type")}</strong>{details.homeType || details.homeSize || "—"}</span>
        <span><strong>{t("Floors")}</strong>{details.floors || "—"}</span>
        <span><strong>{t("Bedrooms")}</strong>{details.bedrooms || "—"}</span>
        <span><strong>{t("Estimated budget")}</strong>{details.budget || "—"}</span>
      </div>
      {nextScheduledVisit && (
        <p className="enquiry-management-meta">
          <strong>{t("Next land inspection")}:</strong> {formatDate(nextScheduledVisit.scheduledAt, language, true)}
          {nextScheduledVisit.location ? ` · ${nextScheduledVisit.location}` : ""}
        </p>
      )}

      <ContactActions enquiry={enquiry} isBuildRequest t={t} />

      <div className="customer-request-actions">
        <button type="button" className="view-action" aria-expanded={requirementsOpen} onClick={() => setRequirementsOpen((open) => !open)}>
          {requirementsOpen ? t("Hide Requirements") : t("View Full Requirements")}
        </button>
        <button type="button" className="edit-action" disabled={saving} onClick={() => setVisitOpen((open) => !open)}>
          {t("Schedule Land / Site Inspection")}
        </button>
        <button type="button" className="edit-action" disabled={saving} onClick={() => setQuotationOpen((open) => !open)}>
          {enquiry.quotation ? t("Update Quotation") : t("Add Construction Quotation")}
        </button>
        <button type="button" className="edit-action" disabled={saving} aria-expanded={progressOpen} onClick={() => setProgressOpen((open) => !open)}>
          {t("Add Construction Progress Milestone")}
        </button>
        {enquiry.status !== "Cancelled" && (
          <button type="button" className="edit-action" disabled={saving} onClick={() => onStatusChange(enquiry._id, "Cancelled")}>
            {t("Cancel Request")}
          </button>
        )}
        {enquiry.status !== "Closed" && (
          <button type="button" className="edit-action" disabled={saving} onClick={() => onStatusChange(enquiry._id, "Closed")}>
            {t("Close Request")}
          </button>
        )}
        <button type="button" className="delete-btn" disabled={saving} onClick={() => {
          if (window.confirm(t("Delete this construction request? This action cannot be undone."))) onDelete(enquiry._id);
        }}>
          {t("Delete Request")}
        </button>
      </div>

      <AdminNotes enquiry={enquiry} onSave={onSave} saving={saving} t={t} language={language} />

      {enquiry.quotation && (
        <details className="request-history">
          <summary>{t("Construction Quotation")} · {t(enquiry.quotation.status)}</summary>
          <div className="request-visit-item">
            {enquiry.quotation.reference && <p><strong>{t("Reference")}:</strong> {enquiry.quotation.reference}</p>}
            <p><strong>{t("Estimated total")}:</strong> ₹{Number(enquiry.quotation.amount || 0).toLocaleString("en-IN")}</p>
            <p>{t("Material cost")}: ₹{Number(enquiry.quotation.materialCost || 0).toLocaleString("en-IN")} · {t("Labour cost")}: ₹{Number(enquiry.quotation.labourCost || 0).toLocaleString("en-IN")} · {t("Additional charges")}: ₹{Number(enquiry.quotation.additionalCharges || 0).toLocaleString("en-IN")}</p>
            {enquiry.quotation.description && <p>{enquiry.quotation.description}</p>}
            {enquiry.quotation.details && <p>{enquiry.quotation.details}</p>}
            {enquiry.quotation.quotedAt && <p>{t("Quotation date")}: {formatDate(enquiry.quotation.quotedAt, language)}</p>}
            {enquiry.quotation.validUntil && <p>{t("Valid until")}: {formatDate(enquiry.quotation.validUntil, language)}</p>}
          </div>
        </details>
      )}

      {requirementsOpen && (
        <div className="request-detail-panel">
          <h3>{t("Full Construction Requirements")}</h3>
          <div className="build-requirements-summary">
            <span><strong>{t("Land location")}</strong>{details.landLocation || "—"}</span>
            <span><strong>{t("Plot area")}</strong>{details.plotArea || "—"}</span>
            <span><strong>{t("Preferred house type")}</strong>{details.homeType || "—"}</span>
            <span><strong>{t("Preferred home size")}</strong>{details.homeSize || "—"}</span>
            <span><strong>{t("Number of floors")}</strong>{details.floors || "—"}</span>
            <span><strong>{t("Bedrooms")}</strong>{details.bedrooms || "—"}</span>
            <span><strong>{t("Estimated budget")}</strong>{details.budget || "—"}</span>
            <span><strong>{t("Preferred design")}</strong>{details.preferredDesign || "—"}</span>
          </div>
          <p><strong>{t("Additional construction requirements")}: </strong>{details.additionalRequirements || "—"}</p>
          <p><strong>{t("Original request")}: </strong>{enquiry.message}</p>
        </div>
      )}

      {visitOpen && (
        <form className="request-management-form" onSubmit={handleVisitSubmit}>
          <h3>{t("Schedule Land / Site Inspection")}</h3>
          <label>{t("Inspection date and time")}<input name="scheduledAt" type="datetime-local" min={toDateTimeLocal()} required /></label>
          <label>{t("Meeting location")}<input name="location" type="text" maxLength="300" /></label>
          <label>{t("Instructions")}<textarea name="instructions" rows="2" maxLength="1000" /></label>
          <label>{t("Inspection notes")}<textarea name="notes" rows="2" maxLength="1000" /></label>
          <button type="submit" className="enquiry-management-save" disabled={saving}>{t("Save Inspection")}</button>
        </form>
      )}

      {quotationOpen && (
        <form className="request-management-form" onSubmit={handleQuotationSubmit}>
          <h3>{t("Construction Quotation")}</h3>
          <div className="request-management-form-grid">
            <label>{t("Quotation reference")}<input name="reference" type="text" maxLength="80" defaultValue={enquiry.quotation?.reference || ""} /></label>
            <label>{t("Quotation date")}<input name="quotedAt" type="date" defaultValue={enquiry.quotation?.quotedAt ? new Date(enquiry.quotation.quotedAt).toISOString().slice(0, 10) : toDateTimeLocal().slice(0, 10)} /></label>
          </div>
          <label>{t("Construction or service description")}<textarea name="description" rows="2" maxLength="2000" defaultValue={enquiry.quotation?.description || ""} /></label>
          <div className="request-management-form-grid">
            <label>{t("Material cost (₹)")}<input name="materialCost" type="number" min="0" step="0.01" defaultValue={enquiry.quotation?.materialCost ?? 0} onInput={updateQuotationTotal} /></label>
            <label>{t("Labour cost (₹)")}<input name="labourCost" type="number" min="0" step="0.01" defaultValue={enquiry.quotation?.labourCost ?? 0} onInput={updateQuotationTotal} /></label>
            <label>{t("Additional charges (₹)")}<input name="additionalCharges" type="number" min="0" step="0.01" defaultValue={enquiry.quotation?.additionalCharges ?? 0} onInput={updateQuotationTotal} /></label>
            <label>{t("Estimated total cost (₹)")}<input name="amount" type="number" value={quotationTotal} readOnly required /></label>
          </div>
          <p className="enquiry-management-meta">{t("Calculated estimate")}: ₹{quotationTotal.toLocaleString("en-IN")}</p>
          <label>{t("Quotation valid until")}<input name="validUntil" type="date" defaultValue={enquiry.quotation?.validUntil ? new Date(enquiry.quotation.validUntil).toISOString().slice(0, 10) : ""} /></label>
          <label>{t("Quotation details")}<textarea name="details" rows="3" maxLength="2000" defaultValue={enquiry.quotation?.details || ""} /></label>
          <label>{t("Quotation status")}
            <select name="quotationStatus" defaultValue={enquiry.quotation?.status || "Draft"}>
              {["Draft", "Sent", "Accepted", "Rejected"].map((status) => <option value={status} key={status}>{t(status)}</option>)}
            </select>
          </label>
          <button type="submit" className="enquiry-management-save" disabled={saving}>{saving ? t("Saving...") : t("Save Quotation")}</button>
          {enquiry.quotation?.updatedAt && <p className="enquiry-management-meta">{t("Last updated")}: {formatDate(enquiry.quotation.updatedAt, language, true)}</p>}
        </form>
      )}

      {progressOpen && <form className="request-management-form" onSubmit={handleProgressSubmit}>
        <h3>{t("Add Construction Progress Milestone")}</h3>
        <div className="request-management-form-grid">
          <label>{t("Milestone title")}<input name="milestone" type="text" maxLength="120" required /></label>
          <label>{t("Update date")}<input name="updateDate" type="date" defaultValue={toDateTimeLocal().slice(0, 10)} required /></label>
          <label>{t("Start date")}<input name="startDate" type="date" /></label>
          <label>{t("Target completion date")}<input name="targetCompletionDate" type="date" /></label>
          <label>{t("Actual completion date")}<input name="actualCompletionDate" type="date" /></label>
          <label>{t("Completion percentage")}<input name="progress" type="number" min="0" max="100" value={progressValue} onChange={(event) => setProgressValue(Math.min(100, Math.max(0, Number(event.target.value))))} required /></label>
          <label>{t("Milestone status")}
            <select name="milestoneStatus" defaultValue="Planned">
              {["Planned", "In Progress", "Completed"].map((status) => <option value={status} key={status}>{t(status)}</option>)}
            </select>
          </label>
        </div>
        {progressDateError && <p className="enquiry-form-error" role="alert">{progressDateError}</p>}
        <div className="milestone-progress" role="progressbar" aria-label={t("Construction milestone progress")} aria-valuenow={progressValue} aria-valuemin="0" aria-valuemax="100">
          <div className="milestone-progress-track"><span style={{ width: `${progressValue}%` }} /></div>
          <strong>{progressValue}%</strong>
        </div>
        <label>{t("Description")}<textarea name="description" rows="2" maxLength="1000" /></label>
        <label>{t("Remarks")}<textarea name="remarks" rows="2" maxLength="1000" /></label>
        <button type="submit" className="enquiry-management-save" disabled={saving}>{saving ? t("Saving...") : t("Add Progress Milestone")}</button>
      </form>}

      {(progress.length > 0 || enquiry.siteVisits?.length > 0) && (
        <details className="request-history">
          <summary>{t("Visits and construction progress history")}</summary>
          <VisitHistory
            enquiry={enquiry}
            onSave={onSave}
            saving={saving}
            t={t}
            language={language}
            title="Inspection History"
          />
          <h3>{t("Construction Progress History")}</h3>
          {progress.map((update) => (
            <div className="request-progress-item" key={update._id || `${update.title}-${update.updateDate}`}>
              <div>
                <strong>{update.title}</strong>
                <span>{formatDate(update.updateDate || update.createdAt, language)}</span>
              </div>
              <span>{update.progress}% · {t(update.status)}</span>
              {update.startDate && <span>{t("Start date")}: {formatDate(update.startDate, language)}</span>}
              {update.targetCompletionDate && <span>{t("Target completion date")}: {formatDate(update.targetCompletionDate, language)}</span>}
              {update.actualCompletionDate && <span>{t("Completed")}: {formatDate(update.actualCompletionDate, language)}</span>}
              {update.description && <p>{update.description}</p>}
              {update.remarks && <p>{t("Remarks")}: {update.remarks}</p>}
            </div>
          ))}
        </details>
      )}
    </article>
  );
}

function EnquiryManagement({
  buildRequests,
  enquiries,
  loading,
  error,
  notice,
  savingEnquiryId,
  onRefresh,
  onDelete,
  onSave,
  onStatusChange,
}) {
  const { t, language } = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");
  const statuses = buildRequests ? BUILD_STATUSES : USER_STATUSES;
  const legacyStatuses = useMemo(
    () => [...new Set(
      enquiries
        .filter((enquiry) => buildRequests
          ? isBuildLandRequest(enquiry)
          : isPropertyEnquiry(enquiry))
        .map((enquiry) => enquiry.status)
        .filter((status) => status && !statuses.includes(status))
    )],
    [buildRequests, enquiries, statuses]
  );
  const locale = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN";

  const matchingType = useMemo(
    () => enquiries.filter((enquiry) => (
      buildRequests ? isBuildLandRequest(enquiry) : isPropertyEnquiry(enquiry)
    )),
    [buildRequests, enquiries]
  );
  const summaryCards = useMemo(() => {
    const count = (predicate) => matchingType.filter(predicate).length;
    const pending = (enquiry) => ["Pending", "New"].includes(enquiry.status || "Pending");
    const scheduledVisits = (enquiry) => enquiry.siteVisits?.some((visit) => visit.status === "Scheduled");
    if (buildRequests) {
      return [
        { label: "Total Enquiries", value: matchingType.length, filter: "All" },
        { label: "Pending Enquiries", value: count(pending), filter: "__pending__" },
        { label: "Inspections Scheduled", value: count(scheduledVisits), filter: "__visits__" },
        { label: "Quotations Sent", value: count((enquiry) => enquiry.quotation?.status === "Sent"), filter: "Quotation Sent" },
        { label: "Active Construction Projects", value: count(isActiveConstructionRequest), filter: "__active__" },
        { label: "Completed Requests", value: count((enquiry) => enquiry.status === "Completed"), filter: "Completed" },
      ];
    }
    return [
      { label: "Total Enquiries", value: matchingType.length, filter: "All" },
      { label: "Pending Enquiries", value: count(pending), filter: "__pending__" },
      { label: "Visits Scheduled", value: count(scheduledVisits), filter: "__visits__" },
      { label: "Offers Sent", value: count((enquiry) => enquiry.propertyOffer?.status === "Sent"), filter: "Offer Made" },
      { label: "Confirmed Bookings", value: count((enquiry) => enquiry.status === "Booking Confirmed"), filter: "Booking Confirmed" },
    ];
  }, [buildRequests, matchingType]);

  const records = useMemo(() => {
    const query = search.trim().toLowerCase();
    return matchingType
      .filter((enquiry) => {
        const status = String(enquiry.status || "Pending");
        if (statusFilter === "All") return true;
        if (statusFilter === "__pending__") return ["Pending", "New"].includes(status);
        if (statusFilter === "__visits__") return enquiry.siteVisits?.some((visit) => visit.status === "Scheduled");
        if (statusFilter === "__active__") return isActiveConstructionRequest(enquiry);
        return status === statusFilter;
      })
      .filter((enquiry) => {
        if (!query) return true;
        const details = getBuildDetails(enquiry);
        return [
          enquiry.name,
          enquiry.email,
          enquiry.phone,
          enquiry._id,
          enquiry.requestType,
          enquiry.propertyTitle,
          enquiry.propertyId?.title,
          enquiry.propertyId?.location,
          enquiry.propertyId?.property_type,
          enquiry.message,
          ...Object.values(details),
        ].some((value) => String(value || "").toLowerCase().includes(query));
      })
      .sort((a, b) => {
        if (sortOrder === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        if (sortOrder === "updated") return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
        if (sortOrder === "name") return String(a.name || "").localeCompare(String(b.name || ""), locale);
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
  }, [locale, matchingType, search, sortOrder, statusFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setSortOrder("newest");
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-label">{t(buildRequests ? "CONSTRUCTION REQUESTS" : "USER ENQUIRIES")}</span>
          <h1>{t(buildRequests ? "Build Requests" : "User Enquiries")}</h1>
          <p>{t(buildRequests
            ? "Manage land inspections, construction quotations, and project progress."
            : "Manage customers interested in purchasing or booking listed properties.")}</p>
        </div>
        <button className="refresh-button" onClick={onRefresh} disabled={loading}>
          {loading ? t("Loading...") : t("Refresh")}
        </button>
      </div>

      {error && <div className="admin-message error" role="alert">{t(error)}</div>}
      {notice && <div className="admin-message" role="status">{t(notice)}</div>}

      <section className="enquiry-summary-grid" aria-label={t("Enquiry summary")}>
        {summaryCards.map((card) => (
          <button
            type="button"
            className={`enquiry-summary-card ${statusFilter === card.filter ? "active" : ""}`}
            key={card.label}
            aria-pressed={statusFilter === card.filter}
            onClick={() => setStatusFilter(card.filter)}
          >
            <span>{t(card.label)}</span>
            <strong>{card.value}</strong>
          </button>
        ))}
      </section>

      <div className="request-list-toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t(buildRequests ? "Search build requests..." : "Search user enquiries...")}
          aria-label={t("Search customer requests")}
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label={t("Filter by status")}>
          <option value="All">{t("All statuses")}</option>
          <option value="__pending__">{t("Pending / New")}</option>
          <option value="__visits__">{t("Scheduled visits")}</option>
          {buildRequests && <option value="__active__">{t("Active Construction Projects")}</option>}
          {legacyStatuses.map((status) => <option value={status} key={status}>{t(status)}</option>)}
          {statuses.map((status) => <option value={status} key={status}>{t(status)}</option>)}
        </select>
        <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label={t("Sort enquiries")}>
          <option value="newest">{t("Newest first")}</option>
          <option value="oldest">{t("Oldest first")}</option>
          <option value="updated">{t("Recently updated")}</option>
          <option value="name">{t("Customer name")}</option>
        </select>
        <button type="button" className="clear-enquiry-filters" onClick={clearFilters}>{t("Clear Filters")}</button>
        <span aria-live="polite">{records.length} {t(buildRequests ? "requests" : "enquiries")}</span>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /><p>{t("Loading enquiries...")}</p></div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <h3>{t(buildRequests ? "No Build Requests Found" : "No User Enquiries Found")}</h3>
          <p>{t(buildRequests
            ? "Build Your Dream Home submissions will appear here."
            : "Property enquiries and booking requests will appear here.")}</p>
        </div>
      ) : (
        <div className="customer-request-list">
          {records.map((enquiry) => (
            buildRequests ? (
              <BuildRequestCard
                key={enquiry._id}
                enquiry={enquiry}
                onDelete={onDelete}
                onSave={onSave}
                onStatusChange={onStatusChange}
                saving={savingEnquiryId === enquiry._id}
                t={t}
                language={locale}
              />
            ) : (
              <PropertyEnquiryCard
                key={enquiry._id}
                enquiry={enquiry}
                onDelete={onDelete}
                onSave={onSave}
                onStatusChange={onStatusChange}
                saving={savingEnquiryId === enquiry._id}
                t={t}
                language={locale}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}

export default EnquiryManagement;
