const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['super_admin', 'org_admin', 'club_admin', 'organizer', 'student'], default: 'student' },
  organizationId: { type: String },
  clubIds: [{ type: String }],
  profilePhoto: { type: String },
  rollNumber: { type: String },
  year: { type: Number },
  phone: { type: String },
  interests: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
