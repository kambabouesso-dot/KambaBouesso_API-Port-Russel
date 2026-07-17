var express = require('express');
var router = express.Router();

/* GET home page. */

/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});*/

router.get('/', async (req, res) => {
  res.status(200).json({
    name: 'mon_application',
    version: '1.0',
    status: 200,
    message: 'Bienvenue sur mon application'
  })
});

  module.exports = router;
