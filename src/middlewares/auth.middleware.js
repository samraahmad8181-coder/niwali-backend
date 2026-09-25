const jwt = require('jsonwebtoken');
const sessionModel = require('../models/session.model');

const authenticate = async (req, res, next) => {
    try {
        // Fallback: check headers OR cookies
        let token = null;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token; // If you store your JWT in cookies
        }

        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        const revokedSession = await sessionModel.findSessionByToken(token);
        if (revokedSession) {
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

// Usage: authorizeRoles('admin') or authorizeRoles('admin', 'user')
const authorizeRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
};

module.exports = { authenticate, authorizeRoles };