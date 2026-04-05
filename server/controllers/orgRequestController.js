const OrgRequest = require('../models/OrgRequest');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Credential = require('../models/Credential');

// Get all org onboard requests
exports.getOrgRequests = async (req, res) => {
    try { res.json(await OrgRequest.find().sort({ createdAt: -1 })); }
    catch (err) { res.status(500).json({ message: err.message }); }
};

// Create a new onboard request
exports.createOrgRequest = async (req, res) => {
    try { res.status(201).json(await new OrgRequest(req.body).save()); }
    catch (err) { res.status(400).json({ message: err.message }); }
};

// Approve an onboard request — creates org + admin user + credential
exports.approveOrgRequest = async (req, res) => {
    try {
        const orgReq = await OrgRequest.findByIdAndUpdate(
            req.params.id,
            { status: 'approved' },
            { new: true }
        );
        if (!orgReq) return res.status(404).json({ message: 'Request not found' });

        // 1. Create the Organization
        const org = await new Organization({
            name: orgReq.collegeName,
            domain: orgReq.domain,
            website: orgReq.website || '',
            description: orgReq.description || `${orgReq.collegeName} — onboarded via BVM Campus Management.`,
            admins: [],
            isVerified: true,
            dataHosting: orgReq.dataHosting
        }).save();

        // 2. Create the admin User
        const user = await new User({
            name: orgReq.adminName,
            email: orgReq.adminEmail.toLowerCase().trim(),
            role: 'org_admin',
            organizationId: org._id.toString(),
            clubIds: [],
            interests: [],
            phone: orgReq.adminPhone || ''
        }).save();

        // 3. Update org admins array
        org.admins = [user._id.toString()];
        await org.save();

        // 4. Create Credential
        await new Credential({
            email: orgReq.adminEmail.toLowerCase().trim(),
            password: orgReq.adminPassword || 'Welcome@123',
            userId: user._id.toString()
        }).save();

        res.json({ orgRequest: orgReq, organization: org, adminUser: user });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Reject an onboard request
exports.rejectOrgRequest = async (req, res) => {
    try {
        const orgReq = await OrgRequest.findByIdAndUpdate(
            req.params.id,
            { status: 'rejected' },
            { new: true }
        );
        if (!orgReq) return res.status(404).json({ message: 'Request not found' });
        res.json(orgReq);
    } catch (err) { res.status(500).json({ message: err.message }); }
};
