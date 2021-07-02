const express = require("express");
const authController = require("../controllers/auth");

const router = express.Router();
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.post("/logout", authController.postLogout);

router.get("/registered", authController.getRegistered);
router.post("/registered", authController.postRegistered);

module.exports = router;
