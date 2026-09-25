const jwt = require('jsonwebtoken');
const sessionModel = require('../models/session.model');

const logout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(400).json({ message: 'Token missing.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.decode(token);

        if (decoded && decoded.exp) {
            const expiresAt = new Date(decoded.exp * 1000);
            // Save it to the session table
            await sessionModel.createSession(token, expiresAt);
        }

        return res.status(200).json({ message: 'Logged out successfully.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong.' });
    }
};