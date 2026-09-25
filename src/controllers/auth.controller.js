const jwt = require('jsonwebtoken');
const userModel = require('../models/auth.model');
const sessionModel = require('../models/session.model');
const { hashPassword, comparePassword, generateToken } = require('../services/storage.services');
const fs = require('fs').promises;
const { uploadsDir } = require('../../config/paths');

// Helper to set cookie options cleanly
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
};

// Signup now sets the cookie automatically upon account creation
const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email and password are required.' });
        }

        const existingUser = await userModel.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const hashedPassword = await hashPassword(password);
        const user = await userModel.createUser({ username, email, password: hashedPassword, role: 'user' });

        const token = generateToken(user);

        // Set HttpOnly cookie on signup
        res.cookie('token', token, cookieOptions);

        const { password: _password, ...safeUser } = user;

        return res.status(201).json({
            message: 'Account created successfully',
            user: safeUser
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await userModel.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = generateToken(user);

        // Set the token in an HttpOnly cookie
        res.cookie('token', token, cookieOptions);

        const { password: _password, ...safeUser } = user;

        return res.status(200).json({
            message: "Logged in successfully",
            user: safeUser
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

// Extracts token from COOKIES instead of headers, invalidates it, and clears the cookie
const logout = async (req, res) => {
    try {
        const token = req.cookies?.token; // 👈 Read from cookies
        if (!token) {
            return res.status(400).json({ message: 'Authentication token missing.' });
        }

        const decoded = jwt.decode(token);

        if (decoded && decoded.exp) {
            const expiresAt = new Date(decoded.exp * 1000);
            await sessionModel.createSession(token, expiresAt);
        }

        // Clear the cookie from the browser
        res.clearCookie('token', cookieOptions);

        return res.status(200).json({ message: 'Logged out successfully.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await userModel.findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        return res.status(200).json({ user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

// Protected route — only an existing admin can create another admin.
const createAdmin = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email and password are required.' });
        }

        const existingUser = await userModel.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const hashedPassword = await hashPassword(password);
        const user = await userModel.createUser({ username, email, password: hashedPassword, role: 'admin' });

        const { password: _password, ...safeUser } = user;
        return res.status(201).json({ user: safeUser });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const userId = req.user.id;

        if (!username || !email) {
            return res.status(400).json({ message: 'Username and email are required.' });
        }

        const updatedUser = await userModel.updateProfile(userId, { username, email });
        return res.status(200).json({ message: 'Profile updated successfully.', user: updatedUser });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

const updateProfileImage = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: "Profile image is required." });
        }

        const profileImageUrl = `/uploads/${req.file.filename}`;
        const updatedUser = await userModel.updateProfileImage(userId, profileImageUrl);

        return res.status(200).json({ message: "Profile image updated successfully.", user: updatedUser });
    } catch (err) {
        console.error("UPDATE PROFILE IMAGE ERROR:", err);
        return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new passwords are required.' });
        }

        const user = await userModel.findUserByIdWithPassword(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isMatch = await comparePassword(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        const hashedNewPassword = await hashPassword(newPassword);
        await userModel.updatePassword(userId, hashedNewPassword);

        return res.status(200).json({ message: 'Password changed successfully.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        await userModel.deleteAccount(userId);

        // Clear the cookie since account is deleted
        res.clearCookie('token', cookieOptions);

        return res.status(200).json({ message: 'Account deleted successfully.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

module.exports = {
    signup,
    login,
    logout,
    getMe,
    createAdmin,
    updateProfile,
    updateProfileImage,
    changePassword,
    deleteAccount
};