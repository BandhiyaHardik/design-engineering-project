const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    organizationId: { type: String, required: true },
    logo: { type: String },
    admins: [{ type: String }],
    members: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Club', clubSchema);
