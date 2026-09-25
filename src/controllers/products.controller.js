const db = require('../db/db');
const productModel = require('../models/products.model');

const createProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            original_price,
            sale,
            stock,
            category_id,
            main_image,
            thumbnail_images,
            benefits
        } = req.body;

        // 1. Validate that main_image URL/path was provided in the JSON
        if (!main_image) {
            return res.status(400).json({ success: false, message: "Main image is required." });
        }

        // 2. Save to database
        const newProduct = await productModel.createProduct({
            title,
            description,
            price: parseFloat(price),
            original_price: original_price ? parseFloat(original_price) : null,
            sale: sale === true || sale === 'true',
            stock: stock ? parseInt(stock, 10) : 0,
            category_id: parseInt(category_id, 10),
            main_image,
            thumbnail_images: thumbnail_images || [],
            benefits: benefits || null,
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product: newProduct,
        });
    } catch (error) {
        console.error("Backend error creating product:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

// Used by Admin Dashboard (shows everything)
const getAllProducts = async (req, res) => {
    try {
        const products = await productModel.getAllProducts();
        return res.status(200).json({ products });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

// Used by Frontend Storefront (filters out disabled/out-of-stock items)
const getStorefrontProducts = async (req, res) => {
    try {
        const products = await productModel.getActiveProducts();
        return res.status(200).json({ products });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await productModel.getProductById(Number(req.params.id));
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        return res.status(200).json({ product });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            original_price,
            sale,
            stock,
            category_id,
            main_image,
            thumbnail_images,
            benefits
        } = req.body;

        // Format thumbnail_images safely into a real JS array
        let formattedThumbnails = thumbnail_images;
        if (typeof thumbnail_images === 'string') {
            try {
                formattedThumbnails = JSON.parse(thumbnail_images);
            } catch (err) {
                formattedThumbnails = [thumbnail_images];
            }
        }
        if (!Array.isArray(formattedThumbnails)) {
            formattedThumbnails = formattedThumbnails ? [formattedThumbnails] : [];
        }

        // Pass the cleaned data object instead of raw req.body
        const updatedData = {
            ...(title && { title }),
            ...(description && { description }),
            ...(price && { price: parseFloat(price) }),
            ...(original_price !== undefined && { original_price: original_price ? parseFloat(original_price) : null }),
            ...(sale !== undefined && { sale: sale === true || sale === 'true' }),
            ...(stock !== undefined && { stock: stock ? parseInt(stock, 10) : 0 }),
            ...(category_id && { category_id: parseInt(category_id, 10) }),
            ...(main_image && { main_image }),
            thumbnail_images: formattedThumbnails,
            ...(benefits !== undefined && { benefits })
        };

        const product = await productModel.updateProduct(Number(req.params.id), updatedData);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        return res.status(200).json({ product });
    } catch (err) {
        console.error("Error updating product:", err);
        return res.status(500).json({ message: err.message || 'Something went wrong. Please try again.' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await productModel.deleteProduct(Number(req.params.id));
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        return res.status(200).json({ message: 'Product deleted.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
};

// Search products by keyword (title or description)
const searchProducts = async (req, res) => {
    try {
        const { q } = req.query;

        // Validate that the search query exists
        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query parameter "q" is required.'
            });
        }

        // Call the model function to query the database
        const products = await productModel.searchProducts(q.trim());

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (err) {
        console.error("Error searching products:", err);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again.'
        });
    }
};

const getProductsByCatController = async (req, res) => {
    try {
        const { categoryId } = req.params; // or req.query depending on your route design
        const products = await productModel.getProductsByCategory(categoryId);

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getStorefrontProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    searchProducts,
    getProductsByCatController
};