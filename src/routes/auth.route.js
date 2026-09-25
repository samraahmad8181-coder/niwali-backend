const express = require('express');
const {
    signup,
    login,
    logout,
    getMe,
    createAdmin,
    updateProfile,
    updateProfileImage,
    changePassword,
    deleteAccount
} = require('../controllers/auth.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/admin/create-admin', authenticate, authorizeRoles('admin'), createAdmin);

router.put('/profile', authenticate, updateProfile);
router.put('/profile/image', authenticate, upload.single('profileImage'), updateProfileImage);
router.put('/password', authenticate, changePassword);
router.delete('/account', authenticate, deleteAccount);

module.exports = router;