const Organization = require('../models/Organization');

exports.getOrganizations = async (req, res) => {
    try { res.json(await Organization.find()); }
    catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getOrganizationById = async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id);
        if (!org) return res.status(404).json({ message: 'Organization not found' });
        res.json(org);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createOrganization = async (req, res) => {
    try { res.status(201).json(await new Organization(req.body).save()); }
    catch (err) { res.status(400).json({ message: err.message }); }
};

exports.updateOrganization = async (req, res) => {
    try {
        const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!org) return res.status(404).json({ message: 'Organization not found' });
        res.json(org);
    } catch (err) { res.status(400).json({ message: err.message }); }
};
