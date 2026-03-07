const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    eventId: { type: String, required: true },
    status: { type: String, enum: ['registered', 'waitlisted', 'cancelled'], default: 'registered' },
    ticketQR: { type: String },
    participantName: { type: String, required: true },
    rollNumber: { type: String },
    year: { type: Number },
    phone: { type: String },
    teamName: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);
