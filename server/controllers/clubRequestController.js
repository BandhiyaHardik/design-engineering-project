const ClubRequest = require('../models/ClubRequest');
const Club = require('../models/Club');

exports.getClubRequests = async (req, res) => {
    try { res.json(await ClubRequest.find()); }
    catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createClubRequest = async (req, res) => {
    try { res.status(201).json(await new ClubRequest(req.body).save()); }
    catch (err) { res.status(400).json({ message: err.message }); }
};

exports.approveClubRequest = async (req, res) => {
    try {
        const cr = await ClubRequest.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
        if (!cr) return res.status(404).json({ message: 'Request not found' });
        // Auto-create the club
        const club = await new Club({
            name: cr.clubName,
            description: cr.description,
            organizationId: cr.organizationId,
            admins: [cr.requestedBy],
            members: [cr.requestedBy]
        }).save();
        res.json({ clubRequest: cr, club });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.rejectClubRequest = async (req, res) => {
    try {
        const cr = await ClubRequest.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
        if (!cr) return res.status(404).json({ message: 'Request not found' });
        res.json(cr);
    } catch (err) { res.status(500).json({ message: err.message }); }
};
