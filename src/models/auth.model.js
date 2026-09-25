const pool = require('../db/db'); // Adjust path to your PostgreSQL connection pool

const findUserByEmail = async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0]; // Returns the user object or undefined
};

const findUserById = async (id) => {
    const query = 'SELECT id, username, email, role, profile_image FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

const findUserByIdWithPassword = async (id) => {
    const query = `
        SELECT id, username, email, password, role, profile_image
        FROM users
        WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};

const createUser = async ({ username, email, password, role }) => {
    const query = `
        INSERT INTO users (username, email, password, role) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, username, email, role
    `;
    const values = [username, email, password, role];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const updateProfile = async (id, { username, email }) => {
    const query = `
        UPDATE users 
        SET username = $1, email = $2, updated_at = NOW() 
        WHERE id = $3 
        RETURNING id, username, email, role, profile_image
    `;
    const result = await pool.query(query, [username, email, id]);
    return result.rows[0];
};

const updateProfileImage = async (id, profileImageUrl) => {
    const query = `
        UPDATE users 
        SET profile_image = $1, updated_at = NOW() 
        WHERE id = $2 
        RETURNING id, username, email, role, profile_image
    `;
    const result = await pool.query(query, [profileImageUrl, id]);
    return result.rows[0];
};

const updatePassword = async (id, hashedPassword) => {
    const query = `
        UPDATE users 
        SET password = $1, updated_at = NOW() 
        WHERE id = $id
    `; // Make sure to use proper parameter index ($2 for id if id is second)
    // Corrected query:
    const fixedQuery = `
        UPDATE users 
        SET password = $1, updated_at = NOW() 
        WHERE id = $2
    `;
    await pool.query(fixedQuery, [hashedPassword, id]);
};

const deleteAccount = async (id) => {
    const query = 'DELETE FROM users WHERE id = $1';
    await pool.query(query, [id]);
};

// Don't forget to export them:
module.exports = {
    findUserByEmail,
    findUserById,
    findUserByIdWithPassword,
    createUser,
    updateProfile,
    updateProfileImage,
    updatePassword,
    deleteAccount
};
