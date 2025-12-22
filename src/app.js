const express = require("express")
const app = express()
const cors = require("cors")
const cookieParser = require("cookie-parser")

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))

module.exports = app