const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    domain: { type: String, required: true },
    logo: { type: String },
    website: { type: String },
    description: { type: String, required: true },
    admins: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    dataHosting: { type: String, enum: ['mitra_cloud', 'self_hosted', 'college_server'] },
    customAnnouncement: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
