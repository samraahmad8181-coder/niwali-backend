const orderModel = require("../models/orders.model");
const sendDeliveredEmail = require("../services/sendEmail");

const createOrder = async (req, res) => {
    try {
        const {
            email, firstname, lastname, phone, country,
            city, address, apartment, cashOnDelivery,
            cartItems, products, total_amount
        } = req.body;

        const itemsToSave = cartItems || products || [];

        if (itemsToSave.length === 0) {
            return res.status(400).json({ success: false, message: "No items in cart." });
        }

        const order = await orderModel.createOrder({
            email, firstname, lastname, phone, country,
            city, address, apartment, cashOnDelivery,
            total_amount,
            items: itemsToSave
        });

        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            order
        });

    } catch (error) {
        console.error("ERROR CREATING ORDER:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

const getOrders = async (req, res) => {
    try {
        const rows = await orderModel.getOrders();
        const groupedOrders = {};

        rows.forEach((row) => {
            if (!groupedOrders[row.order_id]) {
                groupedOrders[row.order_id] = {
                    order_id: row.order_id,
                    track_id: row.track_id,
                    firstname: row.firstname,
                    lastname: row.lastname,
                    email: row.email,
                    phone: row.phone,
                    country: row.country,
                    city: row.city,
                    address: row.address,
                    apartment: row.apartment,
                    status: row.status,
                    total_amount: Number(row.total_amount),
                    created_at: row.created_at,
                    products: [],
                };
            }

            if (row.product_id) {
                groupedOrders[row.order_id].products.push({
                    product_id: row.product_id,
                    product_name: row.product_name,
                    image_url: row.image_url,
                    quantity: row.quantity,
                    price: row.price,
                });
            }
        });

        res.status(200).json({
            success: true,
            orders: Object.values(groupedOrders),
        });

    } catch (error) {
        console.error("ERROR FETCHING ORDERS:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
        });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await orderModel.updateOrderStatus(id, status);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        let emailSent = false;
        if (String(status).toLowerCase() === "delivered") {
            try {
                const fullOrder = await orderModel.getOrderByIdWithItems(id);
                await sendDeliveredEmail(fullOrder.email, fullOrder.firstname, fullOrder);
                emailSent = true;
            } catch (emailError) {
                console.error("ERROR SENDING DELIVERED EMAIL:", emailError);
            }
        }

        res.json({
            success: true,
            message: "Status updated successfully",
            emailSent,
            order,
        });

    } catch (error) {
        console.error("ERROR UPDATING STATUS:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createOrder,
    getOrders,
    updateOrderStatus,
};