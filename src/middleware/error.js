// class ErrorHandler extends Error {
//     constructor(message, statusCode) {
//         super(message),
//             this.statusCode = statusCode
//     }
// }


// const errorMIddleware = (err, req, res, next) => {
//     err.statusCode = err.statusCode || 500
//     err.message = err.message || "Internal Server Error"

//     if (err.name === "CastError") {
//         const message = `Invalid ${err.path}`
//         err = new ErrorHandler(message, 400)
//     }

//     if (err.name === "JsonWebTokenError") {
//         const message = "JSON web tokn is invalid.please try again"
//         err = new ErrorHandler(message, 400)
//     }
//     if (err.name === "TokenExpiredError") {
//         const message = "Json Web  token is Expired Try again latewr"
//         err = new ErrorHandler(message, 400)
//     }

//     if (err.code === 1100) {
//         const message = `Duplicate ${Object.keys(err.keyValue)} Entered`
//         err = new ErrorHandler(message, 400)
//     }
//     return res.status(err, statusCode).json({
//         success: false,
//         message: err.message
//     })
// }

// module.exports = { ErrorHandler, errorMIddleware }
class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

const errorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    if (err.name === "CastError") {
        err = new ErrorHandler(`Invalid ${err.path}`, 400);
    }

    if (err.name === "JsonWebTokenError") {
        err = new ErrorHandler("JWT is invalid. Please try again.", 401);
    }

    if (err.name === "TokenExpiredError") {
        err = new ErrorHandler("JWT has expired. Please login again.", 401);
    }

    // if (err.code === 11000) {
    //     err = new ErrorHandler(
    //         `Duplicate ${Object.keys(err.keyValue)} entered`,
    //         400
    //     );
    // }
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        err = new ErrorHandler(message, 400);
    }

    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};

module.exports = errorMiddleware;
module.exports.ErrorHandler = ErrorHandler;
