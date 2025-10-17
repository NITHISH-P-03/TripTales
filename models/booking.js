const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  listing: {
    type: Schema.Types.ObjectId,
    ref: "Listing",
    required: true
  },
  checkin: { type: Date, required: true },
  checkout: { type: Date, required: true },
  guests: { type: Number, required: true },
  paymentStatus: { type: String, default: "Pending" },
  paymentId: String
});

module.exports = mongoose.model("Booking", bookingSchema);
