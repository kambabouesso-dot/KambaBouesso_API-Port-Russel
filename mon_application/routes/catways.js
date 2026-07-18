var express = require('express');
var router = express.Router();

const auth = require('../middlewares/auth');
const service = require('../services/catways');

// Toute la gestion catways est protegee par JWT.
router.use(auth);

router.get('/', service.getAll);
router.get('/:catwayNumber', service.getByNumber);
router.post('/', service.create);
router.put('/:catwayNumber', service.update);
router.delete('/:catwayNumber', service.remove);

module.exports = router;
