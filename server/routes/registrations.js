const express = require('express');
const router = express.Router();
const c = require('../controllers/registrationController');

router.post('/', c.registerForEvent);
router.get('/user/:userId', c.getUserRegistrations);
router.get('/event/:eventId', c.getEventRegistrations);
router.put('/:id/cancel', c.cancelRegistration);

module.exports = router;
