const express = require('express');
const router = express.Router();
const c = require('../controllers/commentController');

router.get('/event/:eventId', c.getCommentsByEvent);
router.post('/', c.createComment);
router.delete('/:id', c.deleteComment);

module.exports = router;
