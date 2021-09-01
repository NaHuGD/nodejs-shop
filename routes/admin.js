const express = require("express");
// const path = require('path');
const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");
const { body } = require("express-validator");

const productValidator = [
  body("title")
    .isString()
    .isLength({ min: 3 })
    .trim()
    .withMessage("產品標題不符合規格"),
  // body("imageUrl").isURL().withMessage("請輸入有效圖片URL"),
  body("price").isFloat().withMessage("請輸入正確金額"),
  body("description")
    .isLength({ min: 5, max: 50 })
    .trim()
    .withMessage("描敘限制5~50文字內"),
];

const router = express.Router();

console.log("isAuthisAuthisAuth", isAuth);

router.get("/add-product", isAuth, adminController.getAddProduct);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/add-product",
  productValidator,
  isAuth,
  adminController.postAddProduct
);

router.post(
  "/edit-product",
  productValidator,
  isAuth,
  adminController.postEditProduct
);

router.post("/delete-product", isAuth, adminController.postDeleteProduct);

router.get("/products", isAuth, adminController.getProducts);

module.exports = router;
