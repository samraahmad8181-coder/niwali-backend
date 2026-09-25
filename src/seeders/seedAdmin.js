require('dotenv').config();
const pool = require('../db/db');
const { hashPassword } = require('../services/storage.services');

const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@niwali.com';
        const adminUsername = process.env.ADMIN_USERNAME || 'SuperAdmin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecure123@';

        // Check if an admin with this email already exists
        const existingAdmin = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);

        if (existingAdmin.rows.length > 0) {
            console.log('Seeding skipped: Admin user already exists.');
            process.exit(0);
        }

        // Hash password securely
        const hashedPassword = await hashPassword(adminPassword);

        // Insert admin user
        const query = `
            INSERT INTO users (username, email, password, role) 
            VALUES ($1, $2, $3, 'admin') 
            RETURNING id, username, email, role
        `;

        const result = await pool.query(query, [adminUsername, adminEmail, hashedPassword]);

        console.log('Admin user seeded successfully:', result.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding admin user:', err);
        process.exit(1);
    }
};

seedAdmin();