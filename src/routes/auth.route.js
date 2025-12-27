const express = require("express")
const { registration, verifyOtp, login, logout, getUSer, forgotPassword, resetPassword, makeAdmin } = require("../controller/auth.Controller")
const isAuthenticate = require("../middleware/authenticate")
const authorizeRoles = require("../middleware/authorizeRoles")
const router = express.Router()


router.post("/registeration", registration)
router.post("/otp-verification", verifyOtp)
router.post("/login", login)
router.get("/logout", isAuthenticate, logout)
router.get("/user", isAuthenticate, getUSer)
router.post("password//forgot", forgotPassword)
router.put("/password/reset/:token", resetPassword)
router.put(
    "/admin/make-admin/:id",
    isAuthenticate,
    authorizeRoles("admin"), // 🔐 only admin can do this
    makeAdmin
);
module.exports = router 