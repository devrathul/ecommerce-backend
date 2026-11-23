const mongoose = require("mongoose")
const Products = require("../models/products");

exports.CreateProduct = async (req, res) => {
    const { name, category, price, stock } = req.body ?? {};

    if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof category !== "string" ||
        !category.trim() ||
        !Number.isFinite(price) ||
        price < 0 ||
        (stock !== undefined && (!Number.isInteger(stock) || stock < 0))
    ) {
        return res.status(400).json({
            message: "Valid name, category, non-negative price, and stock are required",
        });
    }

    try {
        const product = await Products.create({
            name: name.trim(),
            category: category.trim(),
            price,
            stock: stock === undefined ? 0 : stock,
        });

        return res.status(201).json({
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Unable to create product",
        });
    }
};

exports.GetProducts = async (req, res) => {
    try {
        const { search, category, minPrice, maxPrice } = req.query;
        const sortBy = req.query.sortBy ?? "createdAt";
        const order = req.query.order ?? "desc";

        if (
            (search !== undefined && (typeof search !== "string" || !search.trim())) ||
            (category !== undefined && (typeof category !== "string" || !category.trim()))
        ) {
            return res.status(400).json({
                message: "Search and category must be non-empty strings",
            });
        }

        const parsePriceBound = (value) => {
            if (value === undefined) return undefined;
            if (typeof value !== "string" || !value.trim()) return null;

            const parsed = Number(value);
            return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
        };

        const min = parsePriceBound(minPrice);
        const max = parsePriceBound(maxPrice);

        if (
            min === null ||
            max === null ||
            (min !== undefined && max !== undefined && min > max)
        ) {
            return res.status(400).json({
                message: "Price bounds must be non-negative numbers, with minPrice no greater than maxPrice",
            });
        }

        const allowedSortFields = ["name", "price", "createdAt"];
        if (
            typeof sortBy !== "string" ||
            !allowedSortFields.includes(sortBy) ||
            typeof order !== "string" ||
            !["asc", "desc"].includes(order)
        ) {
            return res.status(400).json({
                message: "Invalid sort field or order",
            });
        }

        const filter = {};

        if (category) {
            filter.category = category.trim();
        }

        if (search) {
            const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.$or = [
                { name: { $regex: escapedSearch, $options: "i" } },
                { category: { $regex: escapedSearch, $options: "i" } },
            ];
        }

        if (min !== undefined || max !== undefined) {
            filter.price = {};
            if (min !== undefined) filter.price.$gte = min;
            if (max !== undefined) filter.price.$lte = max;
        }

        const products = await Products.find(filter).sort({
            [sortBy]: order === "asc" ? 1 : -1,
        });

        return res.status(200).json({
            count: products.length,
            products,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Unable to fetch products",
        });
    }
};

exports.GetProductById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
    }

    try {
        const product = await Products.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json({ product });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Unable to fetch product",
        });
    }
};

exports.UpdateProduct = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
    }

    const updates = req.body ?? {};
    const allowedFields = ["name", "category", "price", "stock"];
    const fields = Object.keys(updates);

    if (!fields.length || fields.some((field) => !allowedFields.includes(field))) {
        return res.status(400).json({ message: "No valid product fields provided" });
    }

    if (
        ("name" in updates &&
            (typeof updates.name !== "string" || !updates.name.trim())) ||
        ("category" in updates &&
            (typeof updates.category !== "string" || !updates.category.trim())) ||
        ("price" in updates &&
            (!Number.isFinite(updates.price) || updates.price < 0)) ||
        ("stock" in updates &&
            (!Number.isInteger(updates.stock) || updates.stock < 0))
    ) {
        return res.status(400).json({ message: "Invalid product field value" });
    }

    if (typeof updates.name === "string") updates.name = updates.name.trim();
    if (typeof updates.category === "string") updates.category = updates.category.trim();

    try {
        const product = await Products.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json({
            message: "Product updated successfully",
            product,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Unable to update product" });
    }
};

exports.DeleteProduct = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
    }

    try {
        const product = await Products.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json({
            message: "Product deleted successfully",
            product,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Unable to delete product" });
    }
};