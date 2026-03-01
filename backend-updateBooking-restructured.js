/**
 * Restructured updateBooking controller for your backend.
 * Copy this into your booking controller (e.g. BookingController.updateBooking).
 * Ensure Booking model and checkBookingOverlap are in scope.
 *
 * Handles:
 * 1. Payment-only updates (totalPaid, duePayment, invoiceDetails) without overlap check.
 * 2. Date/room updates with overlap check.
 * 3. Date-wise dailyAmount via invoiceDetails: [{ date, dailyAmount }, ...].
 */

// In your controller file you typically have: const Booking = require('../models/Booking'); etc.

const updateBooking = async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  try {
    const existingBooking = await Booking.findById(id);
    if (!existingBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // --- 1) Payment / Daily Statement fields (no overlap check) ---
    const paymentFields = {};
    if (body.totalPaid !== undefined && body.totalPaid !== null) {
      paymentFields.totalPaid = Number(body.totalPaid);
    }
    if (body.duePayment !== undefined && body.duePayment !== null) {
      paymentFields.duePayment = Number(body.duePayment);
    }
    if (Array.isArray(body.invoiceDetails)) {
      // Normalize: each entry has date (store as Date) and dailyAmount (number). Keeps date-wise dailyAmount.
      paymentFields.invoiceDetails = body.invoiceDetails
        .filter((entry) => entry != null && (entry.date != null || entry.dailyAmount != null))
        .map((entry) => ({
          date: entry.date instanceof Date ? entry.date : new Date(entry.date),
          dailyAmount: Number(entry.dailyAmount) || 0,
        }));
    }

    // --- 2) Date/room fields (trigger overlap check when present) ---
    const hasDateChange = body.checkInDate != null || body.checkOutDate != null;
    const hasRoomChange =
      body.hotelID != null || body.roomNumberID != null || body.roomCategoryID != null;

    if (hasDateChange || hasRoomChange) {
      const hotelID = body.hotelID ?? existingBooking.hotelID;
      const roomNumberID = body.roomNumberID ?? existingBooking.roomNumberID;
      const roomCategoryID = body.roomCategoryID ?? existingBooking.roomCategoryID;
      const checkInDate = body.checkInDate
        ? new Date(body.checkInDate)
        : existingBooking.checkInDate;
      const checkOutDate = body.checkOutDate
        ? new Date(body.checkOutDate)
        : existingBooking.checkOutDate;

      if (!checkInDate || !checkOutDate || isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return res.status(400).json({
          error: "Valid checkInDate and checkOutDate are required",
        });
      }

      const overlappingBooking = await checkBookingOverlap(
        hotelID,
        roomNumberID,
        roomCategoryID,
        checkInDate,
        checkOutDate,
        id
      );

      if (overlappingBooking) {
        return res.status(409).json({
          error: "Room is already booked for the selected dates",
          details: {
            existingBooking: {
              bookingNo: overlappingBooking.bookingNo,
              checkInDate: overlappingBooking.checkInDate,
              checkOutDate: overlappingBooking.checkOutDate,
              guestName: overlappingBooking.fullName,
            },
            requestedDates: { checkInDate, checkOutDate },
          },
        });
      }
    }

    // --- 3) Build update payload: only include fields that were sent ---
    const updatePayload = { ...paymentFields };

    // Add date/room fields if present (normalize dates to Date objects if your schema expects them)
    if (body.checkInDate != null) updatePayload.checkInDate = new Date(body.checkInDate);
    if (body.checkOutDate != null) updatePayload.checkOutDate = new Date(body.checkOutDate);
    if (body.hotelID != null) updatePayload.hotelID = body.hotelID;
    if (body.roomNumberID != null) updatePayload.roomNumberID = body.roomNumberID;
    if (body.roomCategoryID != null) updatePayload.roomCategoryID = body.roomCategoryID;

    // Add any other allowed booking fields your API accepts (e.g. fullName, phone, totalBill, advancePayment, etc.)
    const allowedKeys = [
      "fullName", "nidPassport", "address", "phone", "hotelName",
      "roomCategoryName", "roomNumberName", "roomPrice", "nights", "adults", "children",
      "totalBill", "advancePayment", "paymentMethod", "transactionId",
      "isKitchen", "extraBed", "bookedBy", "bookedByID", "updatedByID",
      "bookingNo", "serialNo", "kitchenTotalBill", "extraBedTotalBill", "reference", "statusID",
    ];
    allowedKeys.forEach((key) => {
      if (body[key] !== undefined) updatePayload[key] = body[key];
    });

    const booking = await Booking.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.status(200).json({ message: "Booking updated successfully", booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { updateBooking };
