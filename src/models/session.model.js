const pool = require('../db/db');

// Save token to session table when user logs out
const createSession = async (token, expiresAt) => {
    const query = `
        INSERT INTO session (token, expires_at) 
        VALUES ($1, $2) 
        ON CONFLICT (token) DO NOTHING
    `;
    await pool.query(query, [token, expiresAt]);
};

// Check if token exists in the session table
const findSessionByToken = async (token) => {
    const query = 'SELECT * FROM session WHERE token = $1';
    const result = await pool.query(query, [token]);
    return result.rows[0]; // If found, user is logged out
};

module.exports = {
    createSession,
    findSessionByToken
};