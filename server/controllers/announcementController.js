const Announcement = require('../models/Announcement');

exports.getAnnouncementsByEvent = async (req, res) => {
    try { res.json(await Announcement.find({ eventId: req.params.eventId })); }
    catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createAnnouncement = async (req, res) => {
    try { res.status(201).json(await new Announcement(req.body).save()); }
    catch (err) { res.status(400).json({ message: err.message }); }
};

exports.updateAnnouncement = async (req, res) => {
    try {
        const a = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!a) return res.status(404).json({ message: 'Announcement not found' });
        res.json(a);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ message: 'Announcement deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
};
