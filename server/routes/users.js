const express = require('express');
const router = express.Router();
const c = require('../controllers/userController');

router.post('/login', c.login);
router.post('/register', c.register);
router.get('/', c.getUsers);
router.get('/:id', c.getProfile);
router.put('/:id/role', c.updateUserRole);

module.exports = router;
