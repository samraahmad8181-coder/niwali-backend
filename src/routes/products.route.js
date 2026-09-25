const express = require('express');
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    searchProducts,
    getProductsByCatController
} = require('../controllers/products.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.get('/', getAllProducts);

// 1. Static routes MUST come before /:id
router.get('/search', searchProducts);
router.get('/category/:categoryId', getProductsByCatController);

// 2. Dynamic route comes last among gets
router.get('/:id', getProductById);

router.post(
    '/',
    authenticate,
    authorizeRoles('admin'),
    createProduct
);

router.put('/:id', authenticate, authorizeRoles('admin'), updateProduct);
router.delete('/:id', authenticate, authorizeRoles('admin'), deleteProduct);

module.exports = router;