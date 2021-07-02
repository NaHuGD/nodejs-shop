const express = require("express");
const authController = require("../controllers/auth");
const { check, body } = require("express-validator");
const User = require("../models/user");

const router = express.Router();
router.get("/login", authController.getLogin);
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("請輸入正確email"),
    body("password")
      .isLength({ min: 5 })
      .withMessage("密碼需大於5位數")
      .isAlphanumeric()
      .withMessage("密碼須為英文或數字"),
  ],
  authController.postLogin
);
router.post("/logout", authController.postLogout);

router.get("/registered", authController.getRegistered);
router.post(
  "/registered",
  [
    check("email")
      .isEmail()
      .withMessage("請輸入正確郵件")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("該用戶已經存在");
          }
        });
      })
      .normalizeEmail(),
    body("password")
      .isLength({ min: 5 })
      .withMessage("密碼需大於5位數")
      .isAlphanumeric()
      .withMessage("密碼須為英文或數字")
      .trim(),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("密碼與重複密碼需一致");
      }
      return true;
    }),
  ],
  authController.postRegistered
);

router.get("/reset", authController.getReset);
// 修改密碼
router.get("/reset/:token", authController.getNewPassword);
router.post("/reset", authController.postReset);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
