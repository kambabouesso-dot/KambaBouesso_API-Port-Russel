var express = require('express');
var router = express.Router();

const auth = require('../middlewares/auth');
const service = require('../services/reservations');

// Toutes les operations de reservation sont reservees aux utilisateurs connectes.
router.use(auth);

router.get('/', service.getAll);
router.get('/catway/:catwayNumber', service.getByCatwayNumber);
router.get('/:id', service.getById);
router.post('/', service.create);
router.put('/:id', service.update);
router.delete('/:id', service.remove);

module.exports = router;
