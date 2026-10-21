import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLocale } from "./LocaleContext";

function Payment() {

  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLocale();

  const property = location.state?.property;

  const [paymentMethod, setPaymentMethod] = useState("");

  if (!property) {
    return (
      <div className="payment-page">

        <div className="payment-container">

          <h2>{t("No Property Selected")}</h2>

          <button onClick={() => navigate("/")}>
            {t("Back to Home")}
          </button>

        </div>

      </div>
    );
  }

  const totalAmount = Number(property.price || 0);

  const advanceAmount = totalAmount * 0.10;

  const remainingAmount =
    totalAmount - advanceAmount;

  const handlePayment = () => {

    if (!paymentMethod) {
      alert(t("Please select a payment method."));
      return;
    }

    alert(
      `${t("Payment Method")}: ${t(paymentMethod)}\n${t("Advance Amount")}: ₹${advanceAmount.toLocaleString("en-IN")}`
    );
  };

  return (
    <div className="payment-page">

      <div className="payment-container">

        <h1>{t("Payment")}</h1>

        <div className="payment-property">

          <h2>{property.title}</h2>

          <p>
            📍 {property.location}
          </p>

          <p>
            {t("Property Type")}:{" "}
            {property.property_type}
          </p>

        </div>

        <div className="amount-details">

          <h2>{t("Amount Details")}</h2>

          <div className="amount-row">
            <span>{t("Total Property Price")}</span>

            <strong>
              ₹{totalAmount.toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="amount-row">
            <span>{t("Advance Payment (10%)")}</span>

            <strong>
              ₹{advanceAmount.toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="amount-row">
            <span>{t("Remaining Payment")}</span>

            <strong>
              ₹{remainingAmount.toLocaleString("en-IN")}
            </strong>
          </div>

        </div>

        <div className="payment-options">

          <h2>{t("Select Payment Method")}</h2>

          <label>
            <input
              type="radio"
              name="payment"
              value="UPI"
              onChange={(e) =>
                setPaymentMethod(e.target.value)
              }
            />
            📱 {t("UPI")}
          </label>

          <label>
            <input
              type="radio"
              name="payment"
              value="Credit/Debit Card"
              onChange={(e) =>
                setPaymentMethod(e.target.value)
              }
            />
            💳 {t("Credit / Debit Card")}
          </label>

          <label>
            <input
              type="radio"
              name="payment"
              value="Net Banking"
              onChange={(e) =>
                setPaymentMethod(e.target.value)
              }
            />
            🏦 {t("Net Banking")}
          </label>

          <label>
            <input
              type="radio"
              name="payment"
              value="Cash"
              onChange={(e) =>
                setPaymentMethod(e.target.value)
              }
            />
            💵 {t("Cash")}
          </label>

        </div>

        <button
          className="pay-button"
          onClick={handlePayment}
        >
          {t("Pay Advance")} ₹
          {advanceAmount.toLocaleString("en-IN")}
        </button>

      </div>

    </div>
  );
}

export default Payment;