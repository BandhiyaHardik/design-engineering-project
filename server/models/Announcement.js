const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    eventId: { type: String, required: true },
    message: { type: String, required: true },
    postedBy: { type: String, required: true },
    postedByName: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
