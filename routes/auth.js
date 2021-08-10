const express = require("express");
const authController = require("../controllers/auth");

const router = express.Router();
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.post("/logout", authController.postLogout);

router.get("/registered", authController.getRegistered);
router.post("/registered", authController.postRegistered);

router.get("/reset", authController.getReset);
// 修改密碼
router.get("/reset/:token", authController.getNewPassword);
router.post("/reset", authController.postReset);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
