const express = require("express")
const app = express()
const cors = require("cors")
const cookieParser = require("cookie-parser")
const authRouter = require("./routes/auth.route")
const removeUnverifiedAccount = require("./automation/removeUnverifiedAccount")

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

app.use("/api/auth", authRouter)






const errorMIddleware = require("./middleware/error")

// removeUnverifiedAccount()
app.use(errorMIddleware)


module.exports = app