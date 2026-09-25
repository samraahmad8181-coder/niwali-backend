const dashboardModel = require('../models/dashboard.model');

const handle = (fn, message) => async (req, res) => {
    try {
        const data = await fn(req);
        res.status(200).json(data);
    } catch (error) {
        console.error(`${message}:`, error);
        res.status(500).json({ message });
    }
};

const getCards = handle(
    () => dashboardModel.getCardStats(),
    'Failed to load dashboard cards'
);

const getSales = handle(
    () => dashboardModel.getSalesData(),
    'Failed to load sales data'
);

// GET /top-products?period=this_month&limit=3
const getTopProducts = handle(
    (req) => dashboardModel.getTopSellingProducts(req.query.period, Number(req.query.limit) || 3),
    'Failed to load top selling products'
);

// GET /latest-orders?period=today&limit=4
const getLatestOrders = handle(
    (req) => dashboardModel.getLatestOrders(req.query.period, Number(req.query.limit) || 4),
    'Failed to load latest orders'
);

const getBuyers = handle(
    () => dashboardModel.getBuyersByCountry(),
    'Failed to load buyers segmentation'
);

module.exports = {
    getCards,
    getSales,
    getTopProducts,
    getLatestOrders,
    getBuyers,
};