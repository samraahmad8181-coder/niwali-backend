const pool = require('../db/db');

// Whitelisted date ranges. Only these SQL fragments are ever interpolated,
// never raw user input.
const PERIODS = {
    today: ["date_trunc('day', NOW())", "date_trunc('day', NOW()) + INTERVAL '1 day'"],
    this_week: ["date_trunc('week', NOW())", "date_trunc('week', NOW()) + INTERVAL '1 week'"],
    this_month: ["date_trunc('month', NOW())", "date_trunc('month', NOW()) + INTERVAL '1 month'"],
    last_month: ["date_trunc('month', NOW()) - INTERVAL '1 month'", "date_trunc('month', NOW())"],
    this_year: ["date_trunc('year', NOW())", "date_trunc('year', NOW()) + INTERVAL '1 year'"],
};

const getRange = (period, fallback) => PERIODS[period] || PERIODS[fallback];

// Status values are compared in lowercase, so "Canceled" / "Cancelled" both match
const CANCELED = "('canceled', 'cancelled')";
const PENDING = "('pending', 'pendinng')";

// "last 1 month" vs the month before it
const CUR = "created_at >= NOW() - INTERVAL '30 days'";
const PREV = "created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days'";

const trend = (current, previous) => {
    const cur = Number(current) || 0;
    const prev = Number(previous) || 0;
    const change = prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);
    return { change: Math.abs(change), up: change >= 0 };
};

const getCardStats = async () => {
    const products = await pool.query(`
        SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE ${CUR})::int AS cur,
            COUNT(*) FILTER (WHERE ${PREV})::int AS prev
        FROM products;
    `);

    const orders = await pool.query(`
        SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE ${CUR})::int AS total_cur,
            COUNT(*) FILTER (WHERE ${PREV})::int AS total_prev,

            COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW()))::int AS today,
            COUNT(*) FILTER (
                WHERE created_at >= date_trunc('day', NOW()) - INTERVAL '1 day'
                  AND created_at < date_trunc('day', NOW())
            )::int AS yesterday,

            COUNT(*) FILTER (WHERE LOWER(status) IN ${CANCELED})::int AS canceled,
            COUNT(*) FILTER (WHERE LOWER(status) IN ${CANCELED} AND ${CUR})::int AS canceled_cur,
            COUNT(*) FILTER (WHERE LOWER(status) IN ${CANCELED} AND ${PREV})::int AS canceled_prev,

            COUNT(*) FILTER (WHERE LOWER(status) IN ${PENDING})::int AS pending,
            COUNT(*) FILTER (WHERE LOWER(status) IN ${PENDING} AND ${CUR})::int AS pending_cur,
            COUNT(*) FILTER (WHERE LOWER(status) IN ${PENDING} AND ${PREV})::int AS pending_prev
        FROM orders;
    `);

    const p = products.rows[0];
    const o = orders.rows[0];

    return {
        totalProducts: { value: p.total, ...trend(p.cur, p.prev) },
        // today's orders, compared with yesterday
        currentOrders: { value: o.today, ...trend(o.today, o.yesterday) },
        // all orders ever placed, growth over the last 30 days
        totalOrders: { value: o.total, ...trend(o.total_cur, o.total_prev) },
        cancelOrders: { value: o.canceled, ...trend(o.canceled_cur, o.canceled_prev) },
        pendingOrders: { value: o.pending, ...trend(o.pending_cur, o.pending_prev) },
    };
};

// Revenue by weekday: this month vs previous month (canceled orders excluded)
const getSalesData = async () => {
    const result = await pool.query(`
        SELECT
            EXTRACT(DOW FROM created_at)::int AS dow,
            COALESCE(SUM(total_amount) FILTER (
                WHERE created_at >= date_trunc('month', NOW())
            ), 0)::float AS this_month,
            COALESCE(SUM(total_amount) FILTER (
                WHERE created_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
                  AND created_at < date_trunc('month', NOW())
            ), 0)::float AS prev_month
        FROM orders
        WHERE created_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
          AND LOWER(status) NOT IN ${CANCELED}
        GROUP BY dow;
    `);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Always return all 7 days so the chart never has gaps
    return days.map((day, i) => {
        const row = result.rows.find((r) => r.dow === i);
        return {
            day,
            thisMonth: row ? row.this_month : 0,
            prevMonth: row ? row.prev_month : 0,
        };
    });
};

const getTopSellingProducts = async (period, limit = 3) => {
    const [start, end] = getRange(period, 'this_month');

    const result = await pool.query(
        `
        SELECT
            p.id,
            p.title AS name,
            p.main_image AS img,
            SUM(oi.quantity)::int AS sold
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.created_at >= ${start} AND o.created_at < ${end}
          AND LOWER(o.status) NOT IN ${CANCELED}
        GROUP BY p.id, p.title, p.main_image
        ORDER BY sold DESC
        LIMIT $1;
        `,
        [limit]
    );
    return result.rows;
};

const getLatestOrders = async (period, limit = 4) => {
    const [start, end] = getRange(period, 'today');

    const result = await pool.query(
        `
        SELECT
            o.id AS order_id,
            CONCAT(o.firstname, ' ', o.lastname) AS customer,
            p.title AS product,
            oi.quantity AS qty,
            CASE
                WHEN LOWER(o.status) IN ${CANCELED} THEN 'Canceled'
                ELSE INITCAP(o.status)
            END AS status
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        WHERE o.created_at >= ${start} AND o.created_at < ${end}
        ORDER BY o.created_at DESC, o.id DESC
        LIMIT $1;
        `,
        [limit]
    );
    return result.rows;
};

// Unique customers (by email) per country
const getBuyersByCountry = async () => {
    const result = await pool.query(`
        SELECT
            INITCAP(TRIM(country)) AS country,
            COUNT(DISTINCT LOWER(email))::int AS customers
        FROM orders
        WHERE country IS NOT NULL AND TRIM(country) <> ''
        GROUP BY INITCAP(TRIM(country))
        ORDER BY customers DESC;
    `);
    return result.rows;
};

module.exports = {
    getCardStats,
    getSalesData,
    getTopSellingProducts,
    getLatestOrders,
    getBuyersByCountry,
};