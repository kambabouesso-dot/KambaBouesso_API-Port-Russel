var express = require('express');
var router = express.Router();

/* GET users listing. */
/*router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});*/

const service = require('../services/users');
router.get('/', service.getAll);
router.get('/:id', service.getById);
router.post('/', service.create);
router.put('/:id', service.update);
router.delete('/:id', service.delete);

module.exports = router;
