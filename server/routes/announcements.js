const express = require('express');
const router = express.Router();
const c = require('../controllers/announcementController');

router.get('/event/:eventId', c.getAnnouncementsByEvent);
router.post('/', c.createAnnouncement);
router.put('/:id', c.updateAnnouncement);
router.delete('/:id', c.deleteAnnouncement);

module.exports = router;
