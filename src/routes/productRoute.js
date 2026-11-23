const express = require("express");
const productController = require("../controllers/productController");
const {
    authenticateToken,
    authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    authenticateToken,
    authorizeRoles("admin"),
    productController.CreateProduct
);

router.get("/", productController.GetProducts);
router.get("/:id", productController.GetProductById);
router.patch(
    "/:id",
    authenticateToken,
    authorizeRoles("admin"),
    productController.UpdateProduct
);
router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("admin"),
    productController.DeleteProduct
);

module.exports = router;