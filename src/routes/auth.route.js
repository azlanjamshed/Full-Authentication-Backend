const express = require("express")
const { registration, verifyOtp, login, logout } = require("../controller/auth.Controller")
const router = express.Router()


router.post("/registeration", registration)
router.post("/otp-verification", verifyOtp)
router.post("/login", login)
router.get("/logout", logout)
module.exports = router