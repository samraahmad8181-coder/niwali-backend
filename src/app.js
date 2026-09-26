require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.route');
const productRoutes = require('./routes/products.route');
const categoryRoutes = require('./routes/categories.route');
const ordersRoutes = require('./routes/orders.route');
const dashboardRoutes = require('./routes/dashboard.route');

const app = express();

// ===============================
// CORS
// ===============================

app.use(
    cors({
        origin: https://niwali-frontend-git-main-samraahmad8181-6269s-projects.vercel.app",
        credentials: true,
    })
);

// ===============================
// BODY PARSER
// ===============================

app.use(express.json({ limit: '50mb' }));

app.use(
    express.urlencoded({
        limit: '50mb',
        extended: true,
    })
);

app.use(cookieParser());

// ===============================
// UPLOADED IMAGES
// ===============================

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "../public/uploads")
    )
);

// ===============================
// API ROUTES
// ===============================

app.use('/api/auth', authRoutes);

app.use('/api/products', productRoutes);

app.use('/api/categories', categoryRoutes);

app.use('/api/orders', ordersRoutes);

app.use('/api/dashboard', dashboardRoutes);


// ===============================
// 404
// ===============================

app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found.',
    });
});

// ===============================
// ERROR
// ===============================

app.use((err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        message: 'Internal server error.',
    });
});

module.exports = app;
