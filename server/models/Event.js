const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    type: { type: String, enum: ['report', 'slides', 'drive', 'recording', 'github', 'other'] },
    title: String,
    link: String,
    uploadedBy: String
}, { timestamps: true });

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    clubId: { type: String, required: true },
    organizationId: { type: String, required: true },
    organizerId: { type: String, required: true },
    eventType: { type: String, enum: ['main_event', 'sub_event'], default: 'main_event' },
    parentEventId: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: { type: String, required: true },
    category: { type: String, enum: ['hackathon', 'workshop', 'seminar', 'tech_talk', 'cultural', 'competition', 'fest', 'other'], required: true },
    capacity: { type: Number, required: true },
    registrationDeadline: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'pending_approval', 'published', 'ongoing', 'completed', 'cancelled'], default: 'published' },
    gallery: [{ type: String }],
    resources: [resourceSchema],
    qrCode: { type: String },
    coOrganizers: [{ type: String }],
    registeredCount: { type: Number, default: 0 },
    attendedCount: { type: Number, default: 0 },
    coverImage: { type: String },
    teamSize: { type: Number },
    allowExternalParticipants: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
