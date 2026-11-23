const mongoose = require("mongoose");
const Orders = require("../models/orders");
const Products = require("../models/products");

const orderError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

exports.CreateOrder = async (req, res) => {
    const { items } = req.body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            message: "Order items are required",
        });
    }

    const quantities = new Map();

    for (const item of items) {
        if (
            !item ||
            typeof item.productId !== "string" ||
            !mongoose.Types.ObjectId.isValid(item.productId) ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1
        ) {
            return res.status(400).json({
                message: "Each item needs a valid productId and positive integer quantity",
            });
        }

        const productId = item.productId;
        quantities.set(
            productId,
            (quantities.get(productId) || 0) + item.quantity
        );
    }

    const session = await mongoose.startSession();
    let createdOrder;

    try {
        await session.withTransaction(async () => {
            const productIds = [...quantities.keys()];
            const products = await Products.find({
                _id: { $in: productIds },
            }).session(session);

            if (products.length !== productIds.length) {
                throw orderError(404, "One or more products were not found");
            }

            const productsById = new Map(
                products.map((product) => [product._id.toString(), product])
            );

            const orderItems = [];
            let totalAmount = 0;

            for (const [productId, quantity] of quantities) {
                const product = productsById.get(productId);

                if (product.stock < quantity) {
                    throw orderError(
                        409,
                        `Insufficient stock for ${product.name}`
                    );
                }

                const stockUpdate = await Products.updateOne(
                    {
                        _id: product._id,
                        stock: { $gte: quantity },
                    },
                    { $inc: { stock: -quantity } },
                    { session }
                );

                if (stockUpdate.modifiedCount !== 1) {
                    throw orderError(
                        409,
                        `Insufficient stock for ${product.name}`
                    );
                }

                orderItems.push({
                    product: product._id,
                    quantity,
                    priceAtPurchase: product.price,
                });
                totalAmount += product.price * quantity;
            }

            [createdOrder] = await Orders.create(
                [
                    {
                        user: req.user.userId,
                        items: orderItems,
                        totalAmount,
                    },
                ],
                { session }
            );
        });

        return res.status(201).json({
            message: "Order placed successfully",
            order: createdOrder,
        });
    } catch (error) {
        if (!error.statusCode) {
            console.error(error);
        }

        return res
            .status(error.statusCode || 500)
            .json({ message: error.statusCode ? error.message : "Unable to place order" });
    } finally {
        await session.endSession();
    }
};

const getOrderPagination = (query) => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    if (!Number.isInteger(page) || page < 1 ||
        !Number.isInteger(limit) || limit < 1 || limit > 100) {
        return null;
    }

    return { page, limit };
};

exports.GetMyOrders = async (req, res) => {
    const pagination = getOrderPagination(req.query);

    if (!pagination) {
        return res.status(400).json({
            message: "Page must be positive and limit must be between 1 and 100",
        });
    }

    const sortBy = req.query.sortBy ?? "createdAt";
    const order = req.query.order ?? "desc";
    const allowedSortFields = ["createdAt", "totalAmount"];

    if (!allowedSortFields.includes(sortBy) ||
        !["asc", "desc"].includes(order)) {
        return res.status(400).json({
            message: "Invalid sort field or order",
        });
    }

    try {
        const filter = { user: req.user.userId };

        if (req.query.status !== undefined) {
            if (!["pending", "processing", "shipped", "delivered", "cancelled"].includes(req.query.status)) {
                return res.status(400).json({ message: "Invalid order status" });
            }
            filter.status = req.query.status;
        }

        const { page, limit } = pagination;
        const [orders, total] = await Promise.all([
            Orders.find(filter)
                .populate("items.product", "name category price")
                .sort({ [sortBy]: order === "asc" ? 1 : -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Orders.countDocuments(filter),
        ]);

        return res.status(200).json({
            count: orders.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            orders,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Unable to fetch orders" });
    }
};

exports.GetAllOrders = async (req, res) => {
    const pagination = getOrderPagination(req.query);

    if (!pagination) {
        return res.status(400).json({
            message: "Page must be positive and limit must be between 1 and 100",
        });
    }

    const sortBy = req.query.sortBy ?? "createdAt";
    const order = req.query.order ?? "desc";
    const allowedSortFields = ["createdAt", "totalAmount"];

    if (!allowedSortFields.includes(sortBy) ||
        !["asc", "desc"].includes(order)) {
        return res.status(400).json({
            message: "Invalid sort field or order",
        });
    }

    try {
        const filter = {};

        if (req.query.status !== undefined) {
            if (!["pending", "processing", "shipped", "delivered", "cancelled"].includes(req.query.status)) {
                return res.status(400).json({ message: "Invalid order status" });
            }
            filter.status = req.query.status;
        }

        const { page, limit } = pagination;
        const [orders, total] = await Promise.all([
            Orders.find(filter)
                .populate("user", "name email")
                .populate("items.product", "name category price")
                .sort({ [sortBy]: order === "asc" ? 1 : -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Orders.countDocuments(filter),
        ]);

        return res.status(200).json({
            count: orders.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            orders,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Unable to fetch orders" });
    }
};