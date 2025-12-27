const jwt = require("jsonwebtoken");
const catchAsyncError = require("./catchAsyncError");
const { ErrorHandler } = require("./error");
const userModel = require("../models/user.Model");

const isAuthenticate = catchAsyncError(async (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {

            return next(new ErrorHandler("user is not Authenticate", 401))
        }
        if (!process.env.JWT_SECRET) {
            return next(new ErrorHandler("JWT secret missing", 500));
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET)

        req.user = await userModel.findById(decode.id)
        next()
    } catch (err) {
        console.error("JWT ERROR:", err.name, err.message);
        return next(new ErrorHandler("JWT is invalid. Please try again.", 401));
    }
})

module.exports = isAuthenticate
