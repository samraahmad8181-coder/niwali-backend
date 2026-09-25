// const pool = require("../db/db");

// const createOrder = async (
//     email,
//     firstname,
//     lastname,
//     phone,
//     country,
//     city,
//     address,
//     apartment,
//     cashOnDelivery,
//     total_amount
// ) => {

//     const result = await pool.query(
//         `
//         INSERT INTO orders
//         (
//             email,
//             firstname,
//             lastname,
//             phone,
//             country,
//             city,
//             address,
//             apartment,
//             cash_on_delivery,
//             status,
//             total_amount
//         )
//         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
//         RETURNING *
//         `,
//         [
//             email,
//             firstname,
//             lastname,
//             phone,
//             country,
//             city,
//             address,
//             apartment,
//             cashOnDelivery,
//             "Pending",
//             total_amount,
//         ]
//     );

//     return result.rows[0];
// };

// const getOrders = async () => {
//     const result = await pool.query(`
//         SELECT
//             o.id AS order_id,
//             o.firstname,
//             o.lastname,
//             o.email,
//             o.phone,
//             o.country,
//             o.city,
//             o.address,
//             o.apartment,
//             o.status,
//             o.total_amount,
//             o.created_at,

//             oi.product_id,
//             oi.quantity,

//             p.title AS product_name,
//             p.main_image AS image_url,
//             p.price

//         FROM orders o

//         LEFT JOIN order_items oi
//             ON o.id = oi.order_id

//         LEFT JOIN products p
//             ON oi.product_id = p.id

//         ORDER BY o.id DESC
//     `);

//     return result.rows;
// };

// const createOrderItem = async (
//     order_id,
//     product_id,
//     quantity
// ) => {
//     // 1. Insert the item into order_items
//     await pool.query(
//         `
//         INSERT INTO order_items
//         (
//             order_id,
//             product_id,
//             quantity
//         )
//         VALUES ($1, $2, $3)
//         `,
//         [order_id, product_id, quantity]
//     );

//     // 2. Automatically update product order_count and decrease stock
//     await pool.query(
//         `
//         UPDATE products
//         SET order_count = order_count + $1, stock = stock - $1
//         WHERE id = $2
//         `,
//         [quantity, product_id]
//     );
// };

// const updateOrderStatus = async (orderId, status) => {

//     const result = await pool.query(
//         `
//         UPDATE orders
//         SET status = $1
//         WHERE id = $2
//         RETURNING *
//         `,
//         [status, orderId]
//     );

//     return result.rows[0];
// };

// module.exports = {
//     createOrder,
//     getOrders,
//     createOrderItem,
//     updateOrderStatus,
// };



// const pool = require("../db/db");

// const createOrder = async (
//     email,
//     firstname,
//     lastname,
//     phone,
//     country,
//     city,
//     address,
//     apartment,
//     cashOnDelivery,
//     total_amount
// ) => {

//     const result = await pool.query(
//         `
//         INSERT INTO orders
//         (
//             email,
//             firstname,
//             lastname,
//             phone,
//             country,
//             city,
//             address,
//             apartment,
//             cash_on_delivery,
//             status,
//     total_amount

//         )
//         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
//         RETURNING *
//         `,
//         [
//             email,
//             firstname,
//             lastname,
//             phone,
//             country,
//             city,
//             address,
//             apartment,
//             cashOnDelivery,
//             "Pending",
//             total_amount,
//         ]
//     );

//     return result.rows[0];
// };

// const getOrders = async () => {
//     const result = await pool.query(`
//         SELECT
//             o.id AS order_id,
//             o.firstname,
//             o.lastname,
//             o.email,
//             o.phone,
//             o.country,
//             o.city,
//             o.address,
//             o.apartment,
//             o.status,
//             o.total_amount,
//             o.created_at,

//             oi.product_id,
//             oi.quantity,

//             p.title AS product_name, 
//             p.main_image AS image_url, 
//             p.price

//         FROM orders o

//         LEFT JOIN order_items oi
//             ON o.id = oi.order_id

//         LEFT JOIN products p
//             ON oi.product_id = p.id

//         ORDER BY o.id DESC
//     `);

//     return result.rows;
// };

// const createOrderItem = async (
//     order_id,
//     product_id,
//     quantity
// ) => {

//     await pool.query(
//         `
//         INSERT INTO order_items
//         (
//             order_id,
//             product_id,
//             quantity
//         )
//         VALUES ($1,$2,$3)
//         `,
//         [
//             order_id,
//             product_id,
//             quantity
//         ]
//     );
// };

// const updateOrderStatus = async (orderId, status) => {

//     const result = await pool.query(
//         `
//         UPDATE orders
//         SET status = $1
//         WHERE id = $2
//         RETURNING *
//         `,
//         [status, orderId]
//     );

//     return result.rows[0];
// };

// module.exports = {
//     createOrder,
//     getOrders,
//     createOrderItem,
//     updateOrderStatus,
// };


const pool = require("../db/db");
const { generateTrackId } = require("../utils/trackID");

const createOrder = async (orderData) => {
    const {
        email, firstname, lastname, phone, country,
        city, address, apartment, cashOnDelivery, total_amount, items
    } = orderData;

    const cartItems = items || [];
    const client = await pool.connect();

    try {
        let newOrder;

        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                await client.query("BEGIN");

                const trackId = generateTrackId();

                const orderResult = await client.query(
                    `
                    INSERT INTO orders
                    (track_id, email, firstname, lastname, phone, country, city, address, apartment, cash_on_delivery, status, total_amount)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING *;
                    `,
                    [trackId, email, firstname, lastname, phone, country, city, address, apartment, cashOnDelivery, "Pending", total_amount]
                );

                newOrder = orderResult.rows[0];

                for (const item of cartItems) {
                    await client.query(
                        `
                        INSERT INTO order_items (order_id, product_id, quantity)
                        VALUES ($1, $2, $3);
                        `,
                        [newOrder.id, item.product_id, item.quantity]
                    );

                    await client.query(
                        `
                        UPDATE products 
                        SET order_count = order_count + $1, stock = stock - $1, updated_at = NOW()
                        WHERE id = $2;
                        `,
                        [item.quantity, item.product_id]
                    );
                }

                await client.query("COMMIT");
                break; // success, exit retry loop

            } catch (error) {
                await client.query("ROLLBACK");
                const isTrackIdCollision = error.code === "23505" && error.constraint?.includes("track_id");
                if (isTrackIdCollision && attempt < 4) continue; // retry with a new trackId
                throw error;
            }
        }

        return newOrder;

    } finally {
        client.release();
    }
};

const getOrders = async () => {
    const result = await pool.query(`
        SELECT
            o.id AS order_id,
            o.track_id,
            o.firstname,
            o.lastname,
            o.email,
            o.phone,
            o.country,
            o.city,
            o.address,
            o.apartment,
            o.status,
            o.total_amount,
            o.created_at,

            oi.product_id,
            oi.quantity,

            p.title AS product_name, 
            p.main_image AS image_url, 
            p.price

        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        ORDER BY o.id DESC
    `);

    return result.rows;
};

const createOrderItem = async (
    order_id,
    product_id,
    quantity
) => {
    await pool.query(
        `
        INSERT INTO order_items
        (
            order_id,
            product_id,
            quantity
        )
        VALUES ($1, $2, $3)
        `,
        [order_id, product_id, quantity]
    );

    await pool.query(
        `
        UPDATE products 
        SET order_count = order_count + $1, stock = stock - $1 
        WHERE id = $2
        `,
        [quantity, product_id]
    );
};

const updateOrderStatus = async (orderId, status) => {
    const result = await pool.query(
        `
        UPDATE orders
        SET status = $1
        WHERE id = $2
        RETURNING *
        `,
        [status, orderId]
    );

    return result.rows[0];
};

const getOrderByIdWithItems = async (orderId) => {
    const query = `
        SELECT 
            o.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'quantity', oi.quantity,
                        'product', json_build_object(
                            'title', p.title,
                            'price', p.price,
                            'original_price', p.original_price,
                            'main_image', p.main_image
                        )
                    )
                ) FILTER (WHERE oi.id IS NOT NULL), '[]'
            ) AS order_items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.id = $1
        GROUP BY o.id;
    `;
    const result = await pool.query(query, [orderId]);
    return result.rows[0];
};
module.exports = {
    createOrder,
    getOrders,
    createOrderItem,
    updateOrderStatus,
    getOrderByIdWithItems
};