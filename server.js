require("dotenv").config()
const { connect } = require("mongoose")
const app = require("./src/app")
const PORT = process.env.PORT || 8080
const connectDB = require("./src/db/db")
const removeUnverifiedAccount = require("./src/automation/removeUnverifiedAccount")


removeUnverifiedAccount()
connectDB()

app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);

})