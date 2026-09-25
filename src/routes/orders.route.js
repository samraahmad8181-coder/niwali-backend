const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orders.controller");

// Route to create a new order
router.post('/', orderController.createOrder);

// Route to fetch all orders (using your pool and JOIN query from the controller)
router.get('/', orderController.getOrders);

// Route to update order status
router.put("/:id/status", orderController.updateOrderStatus);

module.exports = router;