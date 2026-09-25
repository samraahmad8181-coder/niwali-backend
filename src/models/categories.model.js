const pool = require('../db/db');

const createCategory = async ({ name, slug, description, image }) => {
    const query = `
        INSERT INTO categories (name, slug, description, image) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *;
    `;
    const values = [name, slug, description, image];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const getAllCategories = async () => {
    const query = 'SELECT * FROM categories ORDER BY id DESC';
    const result = await pool.query(query);
    return result.rows;
};

const getCategoryById = async (id) => {
    const query = 'SELECT * FROM categories WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

const updateCategory = async (id, data) => {
    const keys = Object.keys(data);
    if (keys.length === 0) return getCategoryById(id);

    const setClauses = keys.map((key, index) => `${key} = $${index + 1}`);
    const values = keys.map(key => data[key]);
    values.push(id);

    const query = `
        UPDATE categories 
        SET ${setClauses.join(', ')}, updated_at = NOW() 
        WHERE id = $${values.length} 
        RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
};

const deleteCategory = async (id) => {
    const query = 'DELETE FROM categories WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};