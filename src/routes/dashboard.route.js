const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

router.get('/cards', dashboardController.getCards);
router.get('/sales', dashboardController.getSales);
router.get('/top-products', dashboardController.getTopProducts);
router.get('/latest-orders', dashboardController.getLatestOrders);
router.get('/buyers', dashboardController.getBuyers);

module.exports = router;