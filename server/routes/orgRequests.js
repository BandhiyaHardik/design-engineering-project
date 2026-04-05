const express = require('express');
const router = express.Router();
const c = require('../controllers/orgRequestController');

router.get('/', c.getOrgRequests);
router.post('/', c.createOrgRequest);
router.put('/:id/approve', c.approveOrgRequest);
router.put('/:id/reject', c.rejectOrgRequest);

module.exports = router;
