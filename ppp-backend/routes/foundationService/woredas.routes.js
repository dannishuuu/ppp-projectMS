const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');
const WoredaController = require('../../controllers/foundationService/woredas.controller');

router.get('/',     authMiddleware, WoredaController.getWoredas);
router.post('/',    authMiddleware, WoredaController.createWoreda);

router.get('/:id',                    authMiddleware, WoredaController.getWoredaById);
router.put('/:id',                    authMiddleware, WoredaController.updateWoreda);
router.patch('/:id/toggle-status',    authMiddleware, WoredaController.toggleWoredaStatus);
router.delete('/:id',                 authMiddleware, WoredaController.deleteWoreda);

module.exports = router;