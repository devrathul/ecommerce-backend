const express = require("express");
const orderController = require("../controllers/orderController");
const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/my",
    authenticateToken,
    authorizeRoles("user"),
    orderController.GetMyOrders
);

router.get(
    "/admin",
    authenticateToken,
    authorizeRoles("admin"),
    orderController.GetAllOrders
);

router.post(
    "/",
    authenticateToken,
    authorizeRoles("user"),
    orderController.CreateOrder
);

module.exports = router;