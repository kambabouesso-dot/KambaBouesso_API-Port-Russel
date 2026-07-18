var express = require('express');
var router = express.Router();

const authService = require('../services/auth');
const loginRateLimit = require('../middlewares/loginRateLimit');

router.post('/login', loginRateLimit, authService.login);

module.exports = router;
