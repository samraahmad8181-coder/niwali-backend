const {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require("../models/categories.model");

const categoryController = {
    async getCategories(req, res) {
        try {
            const allCategories = await getAllCategories();
            res.status(200).json(allCategories);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getCategoryById(req, res) {
        try {
            const category = await getCategoryById(Number(req.params.id));
            if (!category) {
                return res.status(404).json({ error: "Category not found" });
            }
            res.status(200).json(category);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async createCategory(req, res) {
        try {
            const { name, slug, description, image } = req.body;
            const newCategory = await createCategory({
                name,
                slug,
                description,
                image,
            });
            res.status(201).json(newCategory);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async updateCategory(req, res) {
        try {
            const { name, slug, description, image } = req.body;
            const updatedCategory = await updateCategory(Number(req.params.id), {
                name,
                slug,
                description,
                image,
            });
            if (!updatedCategory) {
                return res.status(404).json({ error: "Category not found" });
            }
            res.status(200).json(updatedCategory);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async deleteCategory(req, res) {
        try {
            const deleted = await deleteCategory(Number(req.params.id));
            if (!deleted) {
                return res.status(404).json({ error: "Category not found" });
            }
            res.status(200).json({ message: "Category deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = categoryController;