const express = require('express');
const router = express.Router();
const c = require('../controllers/orgController');

router.get('/', c.getOrganizations);
router.get('/:id', c.getOrganizationById);
router.post('/', c.createOrganization);
router.put('/:id', c.updateOrganization);

module.exports = router;
