require("dotenv").config()
const { connect } = require("mongoose")
const app = require("./src/app")
const PORT = process.env.PORT || 8080
const connectDB = require("./src/db/db")


connectDB()

app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);

})