const mongoose = require('mongoose');

const clubRequestSchema = new mongoose.Schema({
    clubName: { type: String, required: true },
    description: { type: String, required: true },
    organizationId: { type: String, required: true },
    requestedBy: { type: String, required: true },
    requestedByName: { type: String, required: true },
    requestedByEmail: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('ClubRequest', clubRequestSchema);
