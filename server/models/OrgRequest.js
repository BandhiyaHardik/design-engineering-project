const mongoose = require('mongoose');

const orgRequestSchema = new mongoose.Schema({
    collegeName: { type: String, required: true },
    domain: { type: String, required: true },
    website: { type: String },
    description: { type: String },
    studentCount: { type: Number },
    adminName: { type: String, required: true },
    adminEmail: { type: String, required: true },
    adminPassword: { type: String },
    adminPhone: { type: String },
    designation: { type: String },
    dataHosting: { type: String, enum: ['bvm_cloud', 'self_hosted', 'college_server'], default: 'bvm_cloud' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('OrgRequest', orgRequestSchema);
