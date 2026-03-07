const User = require('../models/User');
const Credential = require('../models/Credential');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const cred = await Credential.findOne({ email: email.toLowerCase().trim() });
        if (!cred || cred.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, rollNumber, year } = req.body;
        const exists = await Credential.findOne({ email: email.toLowerCase().trim() });
        if (exists) return res.status(409).json({ message: 'Email already registered' });

        const user = await new User({
            name,
            email: email.toLowerCase().trim(),
            role: role || 'student',
            rollNumber,
            year: year ? Number(year) : undefined,
            clubIds: [],
            interests: []
        }).save();

        await new Credential({
            email: email.toLowerCase().trim(),
            password,
            userId: user._id.toString()
        }).save();

        res.status(201).json(user);
    } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getUsers = async (req, res) => {
    try { res.json(await User.find()); }
    catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateUserRole = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) { res.status(400).json({ message: err.message }); }
};
