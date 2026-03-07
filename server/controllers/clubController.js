const Club = require('../models/Club');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Comment = require('../models/Comment');
const Announcement = require('../models/Announcement');

exports.getClubs = async (req, res) => {
    try { res.json(await Club.find()); }
    catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getClubById = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });
        res.json(club);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createClub = async (req, res) => {
    try { res.status(201).json(await new Club(req.body).save()); }
    catch (err) { res.status(400).json({ message: err.message }); }
};

exports.updateClub = async (req, res) => {
    try {
        const club = await Club.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!club) return res.status(404).json({ message: 'Club not found' });
        res.json(club);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.deleteClub = async (req, res) => {
    try {
        const club = await Club.findByIdAndDelete(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });
        // Cascade: remove events, registrations, comments, announcements for this club
        const clubEvents = await Event.find({ clubId: req.params.id });
        const eventIds = clubEvents.map(e => e._id.toString());
        await Event.deleteMany({ clubId: req.params.id });
        await Registration.deleteMany({ eventId: { $in: eventIds } });
        await Comment.deleteMany({ eventId: { $in: eventIds } });
        await Announcement.deleteMany({ eventId: { $in: eventIds } });
        res.json({ message: 'Club deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
};
