const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Booking = require("../models/Booking");
const Enquiry = require("../models/Enquiry");
const Payment = require("../models/Payment");
const Property = require("../models/Property");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const buyerMiddleware = require("../middleware/buyerMiddleware");

const CUSTOMER_PAYMENT_FIELDS =
  "amount paymentMethod transactionReference paymentDate verificationStatus createdAt";

const sendRouteError = (res, error, fallbackMessage) => {
  console.error(fallbackMessage, error);
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : fallbackMessage,
  });
};

const requireObjectId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    const error = new Error(`Invalid ${label}.`);
    error.statusCode = 400;
    throw error;
  }
};

const populateAdminBooking = (query) =>
  query
    .populate("property", "title location price image images status")
    .populate("buyer", "name email phone")
    .populate("enquiry", "name email phone propertyTitle status propertyOffer");

// Admins can view every booking and its complete payment audit history.
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const bookings = await populateAdminBooking(
      Booking.find().sort({ createdAt: -1 })
    );
    const payments = await Payment.find({
      booking: { $in: bookings.map((booking) => booking._id) },
    })
      .populate("verifiedBy", "name email")
      .sort({ paymentDate: -1 });
    const paymentsByBooking = new Map();
    for (const payment of payments) {
      const key = String(payment.booking);
      paymentsByBooking.set(key, [
        ...(paymentsByBooking.get(key) || []),
        payment,
      ]);
    }

    res.json({
      bookings: bookings.map((booking) => ({
        ...booking.toObject(),
        payments: paymentsByBooking.get(String(booking._id)) || [],
      })),
    });
  } catch (error) {
    sendRouteError(res, error, "Failed to load bookings.");
  }
});

// Customers can read only their own bookings and non-private payment details.
router.get("/mine", authMiddleware, buyerMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ buyer: req.user.id })
      .populate("property", "title location image images")
      .sort({ createdAt: -1 })
      .lean();
    const payments = await Payment.find({
      booking: { $in: bookings.map((booking) => booking._id) },
      customer: req.user.id,
    })
      .select(CUSTOMER_PAYMENT_FIELDS)
      .sort({ paymentDate: -1 })
      .lean();
    const paymentsByBooking = new Map();
    for (const payment of payments) {
      const key = String(payment.booking);
      paymentsByBooking.set(key, [
        ...(paymentsByBooking.get(key) || []),
        payment,
      ]);
    }
    res.json({
      bookings: bookings.map((booking) => ({
        _id: booking._id,
        bookingReference: booking.bookingReference,
        enquiry: booking.enquiry,
        property: booking.property,
        propertyPrice: booking.propertyPrice,
        agreedAmount: booking.agreedAmount,
        advanceAmount: booking.advanceAmount,
        bookingStatus: booking.bookingStatus,
        createdAt: booking.createdAt,
        confirmedAt: booking.confirmedAt,
        payments: paymentsByBooking.get(String(booking._id)) || [],
      })),
    });
  } catch (error) {
    sendRouteError(res, error, "Failed to load your bookings.");
  }
});

// A booking is initiated only after the customer accepts the published offer.
router.post(
  "/from-enquiry/:enquiryId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    let propertyReserved = false;
    let booking;
    try {
      requireObjectId(req.params.enquiryId, "enquiry ID");
      const enquiry = await Enquiry.findById(req.params.enquiryId);
      if (!enquiry) {
        return res.status(404).json({ message: "Enquiry not found." });
      }
      if (
        enquiry.requestType !== "PropertyBooking" ||
        !enquiry.propertyId ||
        !enquiry.customerId
      ) {
        return res.status(400).json({
          message: "A customer property booking enquiry is required.",
        });
      }
      if (
        enquiry.propertyOffer?.status !== "Accepted" ||
        enquiry.propertyOffer?.customerResponse !== "Accepted"
      ) {
        return res.status(400).json({
          message: "The customer must accept the property offer first.",
        });
      }
      if (enquiry.bookingId) {
        return res.status(409).json({
          message: "A booking already exists for this enquiry.",
        });
      }

      const property = await Property.findById(enquiry.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found." });
      }
      const baseAmount = Number(enquiry.propertyOffer.amount);
      const agreedAmount = Math.max(
        0,
        baseAmount -
          Number(enquiry.propertyOffer.discountAmount || 0) -
          (baseAmount * Number(enquiry.propertyOffer.discountPercent || 0)) / 100
      );
      if (!Number.isFinite(agreedAmount) || agreedAmount <= 0) {
        return res.status(400).json({
          message: "The accepted offer must have an amount greater than zero.",
        });
      }

      booking = new Booking({
        enquiry: enquiry._id,
        property: property._id,
        buyer: enquiry.customerId,
        propertyPrice: property.price,
        advanceAmount: Number((agreedAmount * 0.1).toFixed(2)),
        finalAmount: agreedAmount,
        agreedAmount,
        bookingStatus: "Pending Payment",
      });

      const reservation = await Property.findOneAndUpdate(
        { _id: property._id, status: "Available", reservedBooking: null },
        { $set: { status: "Reserved", reservedBooking: booking._id } },
        { new: true }
      );
      if (!reservation) {
        return res.status(409).json({
          message: "This property is no longer available for booking.",
        });
      }
      propertyReserved = true;

      await booking.save();
      enquiry.bookingId = booking._id;
      const previousStatus = enquiry.status;
      enquiry.status = "Booking in Progress";
      if (previousStatus !== enquiry.status) {
        enquiry.statusHistory.push({
          previousStatus,
          status: enquiry.status,
          changedBy: req.user.id,
        });
      }
      await enquiry.save();

      const result = await populateAdminBooking(
        Booking.findById(booking._id)
      );
      res.status(201).json({
        message: "Booking initiated successfully.",
        booking: { ...result.toObject(), payments: [] },
      });
    } catch (error) {
      if (propertyReserved && booking?._id) {
        await Property.updateOne(
          { _id: booking.property, reservedBooking: booking._id, status: "Reserved" },
          { $set: { status: "Available", reservedBooking: null } }
        );
        if (booking.isNew === false) {
          await Booking.deleteOne({ _id: booking._id });
        }
        await Enquiry.updateOne(
          { _id: req.params.enquiryId, bookingId: booking._id },
          { $unset: { bookingId: 1 }, $set: { status: "Offer Made" } }
        );
      }
      sendRouteError(res, error, "Failed to initiate booking.");
    }
  }
);

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    requireObjectId(req.params.id, "booking ID");
    const isAdmin = req.user.role === "admin";
    const bookingQuery = Booking.findOne({
      _id: req.params.id,
      ...(isAdmin ? {} : { buyer: req.user.id }),
    });
    const booking = await populateAdminBooking(bookingQuery);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }
    const payments = await Payment.find({ booking: booking._id })
      .sort({ paymentDate: -1 });
    if (isAdmin) {
      return res.json({ booking: { ...booking.toObject(), payments } });
    }
    return res.json({
      booking: {
        _id: booking._id,
        bookingReference: booking.bookingReference,
        property: booking.property,
        agreedAmount: booking.agreedAmount,
        advanceAmount: booking.advanceAmount,
        bookingStatus: booking.bookingStatus,
        createdAt: booking.createdAt,
        confirmedAt: booking.confirmedAt,
        payments: payments.map((payment) => ({
          _id: payment._id,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          transactionReference: payment.transactionReference,
          paymentDate: payment.paymentDate,
          verificationStatus: payment.verificationStatus,
        })),
      },
    });
  } catch (error) {
    sendRouteError(res, error, "Failed to load booking.");
  }
});

router.post(
  "/:id/payments",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      requireObjectId(req.params.id, "booking ID");
      const {
        amount,
        paymentMethod,
        transactionReference = "",
        paymentDate,
        receipt = "",
        remarks = "",
      } = req.body || {};
      const numericAmount = Number(amount);
      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0 ||
        Number(numericAmount.toFixed(2)) <= 0
      ) {
        return res.status(400).json({ message: "Payment amount must be greater than zero." });
      }
      if (!["Cash", "Bank Transfer", "UPI", "Cheque", "Other"].includes(paymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method." });
      }
      if (!paymentDate || Number.isNaN(Date.parse(paymentDate)) || Date.parse(paymentDate) > Date.now()) {
        return res.status(400).json({ message: "Enter a valid payment date that is not in the future." });
      }
      if (typeof transactionReference !== "string" || transactionReference.length > 120 ||
        typeof remarks !== "string" || remarks.length > 1000 ||
        typeof receipt !== "string" || receipt.length > 1000) {
        return res.status(400).json({ message: "Payment details exceed the allowed length." });
      }
      if (receipt && !/^https?:\/\//i.test(receipt)) {
        return res.status(400).json({ message: "Receipt must be a valid HTTPS or HTTP URL." });
      }

      const booking = await Booking.findById(req.params.id);
      if (!booking || booking.bookingStatus === "Cancelled") {
        return res.status(404).json({ message: "Active booking not found." });
      }
      const pendingPayments = await Payment.aggregate([
        { $match: { booking: booking._id, verificationStatus: "Pending" } },
        { $group: { _id: null, amount: { $sum: "$amount" } } },
      ]);
      const pendingTotal = pendingPayments[0]?.amount || 0;
      if (
        Number(numericAmount.toFixed(2)) + pendingTotal + booking.verifiedAmount >
        booking.agreedAmount + 0.005
      ) {
        return res.status(400).json({
          message: "Payment entries cannot exceed the remaining agreed balance.",
        });
      }

      const payment = await Payment.create({
        booking: booking._id,
        enquiry: booking.enquiry,
        property: booking.property,
        customer: booking.buyer,
        amount: Number(numericAmount.toFixed(2)),
        paymentMethod,
        transactionReference: transactionReference.trim(),
        paymentDate: new Date(paymentDate),
        receipt: receipt.trim(),
        remarks: remarks.trim(),
      });
      res.status(201).json({ message: "Payment recorded for verification.", payment });
    } catch (error) {
      sendRouteError(res, error, "Failed to record payment.");
    }
  }
);

router.patch(
  "/payments/:paymentId/verification",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      requireObjectId(req.params.paymentId, "payment ID");
      const { verificationStatus, remarks = "" } = req.body || {};
      if (!["Verified", "Rejected"].includes(verificationStatus)) {
        return res.status(400).json({ message: "Choose Verified or Rejected." });
      }
      if (typeof remarks !== "string" || remarks.length > 1000) {
        return res.status(400).json({ message: "Payment remarks must be 1000 characters or fewer." });
      }
      const payment = await Payment.findOne({
        _id: req.params.paymentId,
        verificationStatus: "Pending",
      });
      if (!payment) {
        return res.status(404).json({ message: "Pending payment not found." });
      }
      const booking = await Booking.findById(payment.booking);
      if (!booking || booking.bookingStatus === "Cancelled") {
        return res.status(404).json({ message: "Active booking not found." });
      }

      let updatedBooking;
      if (verificationStatus === "Verified") {
        updatedBooking = await Booking.findOneAndUpdate(
          {
            _id: booking._id,
            bookingStatus: { $nin: ["Cancelled"] },
            verifiedAmount: { $lte: booking.agreedAmount - payment.amount + 0.005 },
          },
          { $inc: { verifiedAmount: payment.amount } },
          { new: true }
        );
        if (!updatedBooking) {
          return res.status(400).json({
            message: "Verified payments cannot exceed the agreed amount.",
          });
        }
      }

      let reviewedPayment;
      try {
        reviewedPayment = await Payment.findOneAndUpdate(
          { _id: payment._id, verificationStatus: "Pending" },
          {
            $set: {
              verificationStatus,
              verifiedBy: req.user.id,
              verifiedAt: new Date(),
              ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
            },
          },
          { new: true }
        );
      } catch (error) {
        if (updatedBooking) {
          await Booking.updateOne(
            { _id: booking._id },
            { $inc: { verifiedAmount: -payment.amount } }
          );
        }
        throw error;
      }
      if (!reviewedPayment) {
        if (updatedBooking) {
          await Booking.updateOne(
            { _id: booking._id },
            { $inc: { verifiedAmount: -payment.amount } }
          );
        }
        return res.status(409).json({
          message: "This payment has already been reviewed.",
        });
      }

      if (updatedBooking) {
        await Booking.updateOne(
          { _id: updatedBooking._id },
          {
            $set: {
              advancePaymentStatus:
                updatedBooking.verifiedAmount >= updatedBooking.advanceAmount - 0.005
                  ? "Paid"
                  : "Pending",
              finalPaymentStatus:
                updatedBooking.verifiedAmount >= updatedBooking.agreedAmount - 0.005
                  ? "Paid"
                  : "Pending",
            },
          }
        );
        if (updatedBooking.bookingStatus !== "Confirmed") {
          await Booking.updateOne(
            { _id: updatedBooking._id, bookingStatus: { $ne: "Confirmed" } },
            {
              $set: {
                bookingStatus:
                  updatedBooking.verifiedAmount >= updatedBooking.agreedAmount - 0.005
                    ? "Fully Paid"
                    : "Partially Paid",
              },
            }
          );
        }
      }

      res.json({
        message: `Payment ${verificationStatus.toLowerCase()}.`,
        payment: reviewedPayment,
      });
    } catch (error) {
      sendRouteError(res, error, "Failed to update payment verification.");
    }
  }
);

const validateConfirmation = async (booking, session) => {
  const paymentQuery = Payment.aggregate([
    { $match: { booking: booking._id, verificationStatus: "Verified" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  if (session) paymentQuery.session(session);
  const totals = await paymentQuery;
  const verifiedTotal = totals[0]?.total || 0;
  const minimumRequired = Number((booking.agreedAmount * 0.1).toFixed(2));
  if (verifiedTotal + 0.005 < minimumRequired) {
    const error = new Error(
      `At least ₹${minimumRequired.toLocaleString("en-IN")} in verified payments is required to confirm.`
    );
    error.statusCode = 400;
    throw error;
  }
};

const confirmWithoutTransaction = async (bookingId, adminId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error("Booking not found.");
    error.statusCode = 404;
    throw error;
  }
  if (booking.bookingStatus === "Confirmed") {
    const error = new Error("Booking is already confirmed.");
    error.statusCode = 409;
    throw error;
  }
  await validateConfirmation(booking);

  const confirmationDate = new Date();
  const claimed = await Booking.findOneAndUpdate(
    {
      _id: booking._id,
      bookingStatus: { $in: ["Pending Payment", "Partially Paid", "Fully Paid"] },
    },
    {
      $set: {
        bookingStatus: "Confirmed",
        confirmedAt: confirmationDate,
        confirmedBy: adminId,
      },
    },
    { new: true }
  );
  if (!claimed) {
    const error = new Error("Booking cannot be confirmed from its current status.");
    error.statusCode = 409;
    throw error;
  }

  const property = await Property.findOneAndUpdate(
    {
      _id: booking.property,
      status: "Reserved",
      reservedBooking: booking._id,
    },
    { $set: { status: "Sold" } },
    { new: true }
  );
  if (!property) {
    await Booking.updateOne(
      { _id: booking._id, bookingStatus: "Confirmed", confirmedBy: adminId },
      {
        $set: { bookingStatus: booking.bookingStatus },
        $unset: { confirmedAt: 1, confirmedBy: 1 },
      }
    );
    const error = new Error("Property reservation has changed; booking was not confirmed.");
    error.statusCode = 409;
    throw error;
  }

  try {
    const enquiry = await Enquiry.findById(booking.enquiry);
    if (!enquiry) throw new Error("Related enquiry was not found.");
    const previousStatus = enquiry.status;
    enquiry.status = "Booking Confirmed";
    if (previousStatus !== enquiry.status) {
      enquiry.statusHistory.push({
        previousStatus,
        status: enquiry.status,
        changedBy: adminId,
      });
    }
    await enquiry.save();
  } catch (error) {
    await Property.updateOne(
      { _id: property._id, status: "Sold", reservedBooking: booking._id },
      { $set: { status: "Reserved" } }
    );
    await Booking.updateOne(
      { _id: booking._id, bookingStatus: "Confirmed", confirmedBy: adminId },
      {
        $set: { bookingStatus: booking.bookingStatus },
        $unset: { confirmedAt: 1, confirmedBy: 1 },
      }
    );
    throw error;
  }
  return Booking.findById(booking._id);
};

router.post(
  "/:id/confirm",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    let session;
    try {
      requireObjectId(req.params.id, "booking ID");
      session = await mongoose.startSession();
      let confirmedBooking;
      try {
        await session.withTransaction(async () => {
          const booking = await Booking.findById(req.params.id).session(session);
          if (!booking) {
            const error = new Error("Booking not found.");
            error.statusCode = 404;
            throw error;
          }
          if (booking.bookingStatus === "Confirmed") {
            const error = new Error("Booking is already confirmed.");
            error.statusCode = 409;
            throw error;
          }
          await validateConfirmation(booking, session);
          const confirmedAt = new Date();
          const bookingUpdate = await Booking.updateOne(
            {
              _id: booking._id,
              bookingStatus: { $in: ["Pending Payment", "Partially Paid", "Fully Paid"] },
            },
            {
              $set: {
                bookingStatus: "Confirmed",
                confirmedAt,
                confirmedBy: req.user.id,
              },
            },
            { session }
          );
          if (!bookingUpdate.modifiedCount) {
            const error = new Error("Booking cannot be confirmed from its current status.");
            error.statusCode = 409;
            throw error;
          }
          const propertyUpdate = await Property.updateOne(
            {
              _id: booking.property,
              status: "Reserved",
              reservedBooking: booking._id,
            },
            { $set: { status: "Sold" } },
            { session }
          );
          if (!propertyUpdate.modifiedCount) {
            const error = new Error("Property reservation has changed.");
            error.statusCode = 409;
            throw error;
          }
          const enquiry = await Enquiry.findById(booking.enquiry).session(session);
          if (!enquiry) throw new Error("Related enquiry was not found.");
          const previousStatus = enquiry.status;
          enquiry.status = "Booking Confirmed";
          if (previousStatus !== enquiry.status) {
            enquiry.statusHistory.push({
              previousStatus,
              status: enquiry.status,
              changedBy: req.user.id,
            });
          }
          await enquiry.save({ session });
          confirmedBooking = booking._id;
        });
      } catch (transactionError) {
        const unsupported =
          /Transaction numbers are only allowed|replica set|mongos|does not support transactions/i
            .test(transactionError.message || "");
        if (!unsupported) throw transactionError;
        confirmedBooking = (await confirmWithoutTransaction(req.params.id, req.user.id))._id;
      }
      const booking = await populateAdminBooking(Booking.findById(confirmedBooking));
      const payments = await Payment.find({ booking: confirmedBooking }).sort({ paymentDate: -1 });
      res.json({
        message: "Booking confirmed and property marked sold.",
        booking: { ...booking.toObject(), payments },
      });
    } catch (error) {
      sendRouteError(res, error, "Failed to confirm booking.");
    } finally {
      await session?.endSession();
    }
  }
);

router.post(
  "/:id/cancel",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    let session;
    try {
      requireObjectId(req.params.id, "booking ID");
      session = await mongoose.startSession();
      let cancelledBookingId;
      await session.withTransaction(async () => {
        const booking = await Booking.findById(req.params.id).session(session);
        if (!booking) {
          const error = new Error("Booking not found.");
          error.statusCode = 404;
          throw error;
        }
        if (["Confirmed", "Completed", "Cancelled"].includes(booking.bookingStatus)) {
          const error = new Error(
            "Only active, unconfirmed bookings can be cancelled."
          );
          error.statusCode = 409;
          throw error;
        }

        const otherActiveBooking = await Booking.exists({
          property: booking.property,
          _id: { $ne: booking._id },
          bookingStatus: { $ne: "Cancelled" },
        }).session(session);
        if (otherActiveBooking) {
          const error = new Error(
            "Another active booking exists for this property; it cannot be released."
          );
          error.statusCode = 409;
          throw error;
        }

        const property = await Property.findOneAndUpdate(
          {
            _id: booking.property,
            status: "Reserved",
            reservedBooking: booking._id,
          },
          { $set: { status: "Available", reservedBooking: null } },
          { new: true, session }
        );
        if (!property) {
          const error = new Error(
            "The property is not reserved by this booking; cancellation was not applied."
          );
          error.statusCode = 409;
          throw error;
        }

        const bookingUpdate = await Booking.updateOne(
          { _id: booking._id, bookingStatus: booking.bookingStatus },
          { $set: { bookingStatus: "Cancelled" } },
          { session }
        );
        if (!bookingUpdate.modifiedCount) {
          const error = new Error("Booking status changed; try again.");
          error.statusCode = 409;
          throw error;
        }

        const enquiry = await Enquiry.findOne({
          _id: booking.enquiry,
          bookingId: booking._id,
        }).session(session);
        if (!enquiry) {
          const error = new Error("The booking's enquiry link could not be verified.");
          error.statusCode = 409;
          throw error;
        }
        const previousStatus = enquiry.status;
        enquiry.status = "Cancelled";
        enquiry.statusHistory.push({
          previousStatus,
          status: "Cancelled",
          changedBy: req.user.id,
          remarks: "Booking cancelled by an administrator.",
        });
        await enquiry.save({ session });
        cancelledBookingId = booking._id;
      });

      const booking = await populateAdminBooking(
        Booking.findById(cancelledBookingId)
      );
      const payments = await Payment.find({ booking: cancelledBookingId })
        .populate("verifiedBy", "name email")
        .sort({ paymentDate: -1 });
      res.json({
        message: "Booking cancelled and its property reservation released.",
        booking: { ...booking.toObject(), payments },
      });
    } catch (error) {
      if (/Transaction numbers are only allowed|replica set|mongos|does not support transactions/i
        .test(error.message || "")) {
        error.statusCode = 503;
        error.message = "Safe booking cancellation requires MongoDB transaction support.";
      }
      sendRouteError(res, error, "Failed to cancel booking.");
    } finally {
      await session?.endSession();
    }
  }
);

module.exports = router;
