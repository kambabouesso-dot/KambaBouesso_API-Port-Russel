var express = require('express');
var router = express.Router();

const authService = require('../services/auth');

router.post('/login', authService.login);

module.exports = router;
