const express = require('express');
const router = express.Router();
const c = require('../controllers/clubRequestController');

router.get('/', c.getClubRequests);
router.post('/', c.createClubRequest);
router.put('/:id/approve', c.approveClubRequest);
router.put('/:id/reject', c.rejectClubRequest);

module.exports = router;
