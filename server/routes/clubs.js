const express = require('express');
const router = express.Router();
const c = require('../controllers/clubController');

router.get('/', c.getClubs);
router.get('/:id', c.getClubById);
router.post('/', c.createClub);
router.put('/:id', c.updateClub);
router.delete('/:id', c.deleteClub);

module.exports = router;
