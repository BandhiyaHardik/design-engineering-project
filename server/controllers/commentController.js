const Comment = require('../models/Comment');

exports.getCommentsByEvent = async (req, res) => {
    try { res.json(await Comment.find({ eventId: req.params.eventId })); }
    catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createComment = async (req, res) => {
    try { res.status(201).json(await new Comment(req.body).save()); }
    catch (err) { res.status(400).json({ message: err.message }); }
};

exports.deleteComment = async (req, res) => {
    try {
        await Comment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Comment deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
};
