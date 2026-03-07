const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    eventId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userPhoto: { type: String },
    message: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
