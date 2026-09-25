const pool = require('../db/db');

const createProduct = async ({
    title,
    description,
    price,
    original_price,
    sale,
    stock,
    status,
    category_id,
    main_image,
    thumbnail_images,
    benefits,
}) => {
    const productStatus = stock === 0 ? 'disabled' : (status || 'active');

    const query = `
        INSERT INTO products (
            title, description, price, original_price, sale, 
            stock, status, category_id, main_image, thumbnail_images, benefits
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING *;
    `;

    const values = [
        title,
        description,
        price,
        original_price,
        sale,
        stock,
        productStatus,
        category_id,
        main_image,
        thumbnail_images,
        benefits ? JSON.stringify(benefits) : null
    ];

    const result = await pool.query(query, values);

    // Fetch the newly created product along with its category name
    return getProductById(result.rows[0].id);
};

// For Admin panel (shows all products + category name)
// For Admin panel (shows all products + category name)
const getAllProducts = async () => {
    const query = `
        SELECT p.*, c.name AS category_id 
        FROM products p
        LEFT JOIN categories c ON p.category_id::integer = c.id
        ORDER BY p.id DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

const getActiveProducts = async () => {
    const query = `
        SELECT p.*, c.name AS category_id 
        FROM products p
        LEFT JOIN categories c ON p.category_id::integer = c.id
        WHERE p.status = 'active' AND p.stock > 0 
        ORDER BY p.id DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

const getProductById = async (id) => {
    const query = `
        SELECT p.*, c.name AS category_id 
        FROM products p
        LEFT JOIN categories c ON p.category_id::integer = c.id
        WHERE p.id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

const updateProduct = async (id, data) => {
    if (data.stock !== undefined) {
        if (Number(data.stock) === 0) {
            data.status = 'disabled';
        } else if (data.status === undefined) {
            data.status = 'active';
        }
    }

    const keys = Object.keys(data);
    if (keys.length === 0) return getProductById(id);

    const setClauses = keys.map((key, index) => `${key} = $${index + 1}`);
    const values = keys.map(key => {
        if (key === 'benefits') {
            return data[key] !== null && data[key] !== undefined && data[key] !== ''
                ? JSON.stringify(data[key])
                : null;
        }
        if (key === 'thumbnail_images') {
            return Array.isArray(data[key]) ? data[key] : (data[key] ? [data[key]] : []);
        }
        return data[key];
    });

    values.push(id);

    const query = `
        UPDATE products 
        SET ${setClauses.join(', ')}, updated_at = NOW() 
        WHERE id = $${values.length} 
        RETURNING id;
    `;

    await pool.query(query, values);

    // Return the updated product fully joined with the category name
    return getProductById(id);
};

const deleteProduct = async (id) => {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// Example inside your products.model.js
const searchProducts = async (searchTerm) => {
    const query = `
        SELECT * FROM products 
        WHERE title ILIKE $1 OR description ILIKE $1
        ORDER BY id DESC;
    `;
    const values = [`%${searchTerm}%`];
    const result = await pool.query(query, values);
    return result.rows; // Adjust based on your DB library (pg, mysql2, etc.)
};

const getProductsByCategory = async (categoryId) => {
    const query = `
        SELECT p.*, c.name AS category_id 
        FROM products p
        LEFT JOIN categories c ON p.category_id::integer = c.id
        WHERE p.category_id::integer = $1 AND p.status = 'active' AND p.stock > 0
        ORDER BY p.id DESC;
    `;
    const result = await pool.query(query, [categoryId]);
    return result.rows;
};

module.exports = {
    createProduct,
    getAllProducts,
    getActiveProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    searchProducts,
    getProductsByCategory
};