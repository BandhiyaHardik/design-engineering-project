const Registration = require('../models/Registration');
const Event = require('../models/Event');

// Register for an event with time-conflict detection
exports.registerForEvent = async (req, res) => {
    const { userId, eventId, participantName, rollNumber, year, phone, teamName } = req.body;

    try {
        // 1. Check if event exists
        const targetEvent = await Event.findById(eventId);
        if (!targetEvent) return res.status(404).json({ message: 'Event not found' });

        // 2. Check if already registered
        const existing = await Registration.findOne({ userId, eventId, status: 'registered' });
        if (existing) return res.status(409).json({ message: 'Already registered for this event.' });

        // 3. Check for time conflicts
        const userRegs = await Registration.find({ userId, status: 'registered' });
        const regEventIds = userRegs.map(r => r.eventId);
        const registeredEvents = await Event.find({ _id: { $in: regEventIds } });

        const targetStart = new Date(targetEvent.startTime);
        const targetEnd = new Date(targetEvent.endTime);

        const conflict = registeredEvents.find(e => {
            const eStart = new Date(e.startTime);
            const eEnd = new Date(e.endTime);
            return (targetStart < eEnd && targetEnd > eStart);
        });

        if (conflict) {
            return res.status(409).json({
                message: `Time conflict with "${conflict.title}". You are already registered for an event during this time.`,
                conflictEvent: conflict
            });
        }

        // 4. Create Registration
        const registration = await new Registration({
            userId,
            eventId,
            participantName,
            rollNumber,
            year,
            phone,
            teamName,
            ticketQR: `QR-${userId}-${eventId}-${Date.now()}`
        }).save();

        // Increment registered count on the event
        targetEvent.registeredCount += 1;
        await targetEvent.save();

        res.status(201).json(registration);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get registrations for a user
exports.getUserRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({ userId: req.params.userId, status: { $ne: 'cancelled' } });
        res.json(registrations);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get registrations for an event
exports.getEventRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({ eventId: req.params.eventId });
        res.json(registrations);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

// Cancel a registration
exports.cancelRegistration = async (req, res) => {
    try {
        const reg = await Registration.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
        if (!reg) return res.status(404).json({ message: 'Registration not found' });
        // Decrement event count
        await Event.findByIdAndUpdate(reg.eventId, { $inc: { registeredCount: -1 } });
        res.json(reg);
    } catch (err) { res.status(500).json({ message: err.message }); }
};
