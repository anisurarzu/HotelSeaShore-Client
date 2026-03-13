/**
 * Delete room controller for your backend.
 * Register as: DELETE /hotels/:hotelId/categories/:categoryId/rooms/:roomId
 *
 * In your router (e.g. hotelRoutes.js or similar):
 *   const { deleteRoom } = require('./path/to/backend-deleteRoom');
 *   router.delete("/hotels/:hotelId/categories/:categoryId/rooms/:roomId", deleteRoom);
 *
 * Ensure in scope: Hotel model, mongoose, sendSuccessResponse, sendErrorResponse.
 * Uses the same hotel/category/room lookup as your updateRoom:
 * - hotelId: MongoDB _id or numeric hotelID
 * - categoryId: _id of the category subdocument (roomCategories.id)
 * - roomId: _id of the room subdocument (roomNumbers.id)
 */

const deleteRoom = async (req, res) => {
  try {
    const { hotelId, categoryId, roomId } = req.params;

    // Find hotel (same as updateRoom)
    let hotel;
    if (mongoose.Types.ObjectId.isValid(hotelId)) {
      hotel = await Hotel.findById(hotelId);
    } else {
      hotel = await Hotel.findOne({ hotelID: parseInt(hotelId) });
    }

    if (!hotel) {
      return sendErrorResponse(res, 404, "Hotel not found");
    }

    // Find category
    const category = hotel.roomCategories.id(categoryId);
    if (!category) {
      return sendErrorResponse(res, 404, "Category not found");
    }

    // Find room
    const room = category.roomNumbers.id(roomId);
    if (!room) {
      return sendErrorResponse(res, 404, "Room not found");
    }

    // Remove the room subdocument from the category's roomNumbers array
    category.roomNumbers.pull(roomId);
    await hotel.save();

    // Optional: emit real-time event (if you have emitHotelEvent)
    if (typeof emitHotelEvent === "function") {
      emitHotelEvent(req, "room:deleted", {
        hotelID: hotel.hotelID,
        categoryId: category._id,
        roomId,
        message: "Room deleted",
      });
    }

    return sendSuccessResponse(res, 200, "Room deleted successfully", { _id: roomId });
  } catch (error) {
    console.error("Delete room error:", error);
    return sendErrorResponse(res, 500, "Failed to delete room");
  }
};

module.exports = { deleteRoom };
