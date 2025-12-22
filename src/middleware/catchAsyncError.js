export const catchAsyncError = (theFunction) => {
    return (req, res, next) => {
        Promises.resolve(theFunction(req, res, next)).catch(next)
    }
}