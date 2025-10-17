const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedin } = require("../middleware.js");
const nodemailer = require("nodemailer");

// Render booking form
router.get("/:listingId", isLoggedin, async (req, res) => {
  const listing = await Listing.findById(req.params.listingId);
  res.render("booking/booking-form", { listing });
});

// Handle booking form submission
router.post("/:listingId", isLoggedin, async (req, res) => {
  const { checkin, checkout, guests } = req.body;
  const listingId = req.params.listingId;

  // Check for overlapping bookings
  const conflictingBooking = await Booking.findOne({
    listing: listingId,
    paymentStatus: "Paid",
    $or: [
      { checkin: { $lt: new Date(checkout) }, checkout: { $gt: new Date(checkin) } }
    ]
  });

  if (conflictingBooking) {
    return res.send("Sorry, the selected dates are already booked!");
  }

  const booking = new Booking({
    user: req.user._id,
    listing: listingId,
    checkin,
    checkout,
    guests
  });

  await booking.save();
  res.redirect(`/booking/payment/${booking._id}`);
});

// Render demo payment page
router.get("/payment/:bookingId", isLoggedin, async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId).populate("listing user");
  res.render("booking/payment", { booking });
});

// Handle demo payment submission
router.post("/payment/success", isLoggedin, async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findByIdAndUpdate(
    bookingId,
    { paymentStatus: "Paid", paymentId: `DEMO${Date.now()}` },
    { new: true }
  ).populate("listing user");

  // Send confirmation email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "maxverstappen0317@gmail.com",
      pass: "mqrg hlss qviy ehem"
    }
  });

  const mailOptions = {
    from: "maxverstappen0317@gmail.com",
    to: booking.user.email, // assuming username is email
    subject: "Booking Confirmation",
    text: `Hi ${booking.user.username},
    
Your booking for ${booking.listing.title} is confirmed.
Check-in: ${booking.checkin.toDateString()}
Check-out: ${booking.checkout.toDateString()}
Guests: ${booking.guests}
Payment ID: ${booking.paymentId}

Thank you for booking with us!`
  };

  let sent=false;

 if(!sent){
     transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.log(err);
    else console.log("Email sent: " + info.response);
  });
  sent=true;
 }

  res.render("booking/booking-success", { booking });
});

module.exports = router;
