var express = require('express');
var router = express.Router();

/* GET users listing. */
/*router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});*/

const service = require('../services/users');
const auth = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');

router.post('/', optionalAuth, service.create);

// Les operations de lecture/modification/suppression exigent un token valide.
router.use(auth);
router.get('/', service.getAll);
router.get('/:id', service.getById);
router.put('/:id', service.update);
router.delete('/:id', service.delete);

module.exports = router;
