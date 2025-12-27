const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler("Access denied", 403));
        }
        next();
    };
};

module.exports = authorizeRoles;