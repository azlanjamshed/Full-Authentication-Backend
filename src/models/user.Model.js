const mongoose = require("mongoose")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        minlength: [5, "Password must have atleast 5 character"],
        maxlength: [15, "Password must have maximum 15 character"],
        select: false
    },
    phone: {
        type: String,
        unique: true,
        require: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user", // ✅ important
    },
    accountVerified: { type: Boolean, default: false },
    // verificationCode: Number,
    verificationCode: String,
    verificationCodeExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: Date,
    modifiedAt: Date
}, { timestamps: true })

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10)

})

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

// userSchema.methods.generateVerificationCode = function () {
//     function generateRandomFiveDigitNumber() {
//         const firstDigit = Math.floor(Math.random() * 9) + 1
//         const remainingDigit = Math.floor(Math.random() * 10000).toString().padStart(4, 0)
//         return parseInt(firstDigit + remainingDigit)

//     }
//     const verificationCode = generateRandomFiveDigitNumber()
//     this.verificationCode = verificationCode
//     this.verificationCodeExpire = Date.now() + 5 * 60 * 1000
//     return verificationCode
// }

userSchema.methods.generateVerificationCode = function () {
    function generateRandomFiveDigitNumber() {
        const firstDigit = Math.floor(Math.random() * 9) + 1
        const remainingDigit = Math.floor(Math.random() * 10000).toString().padStart(4, 0)
        return parseInt(firstDigit + remainingDigit)

    }
    const verificationCode = generateRandomFiveDigitNumber()
    const hashedOtp = crypto.createHash("sha256")
        .update(verificationCode.toString())
        .digest("hex");
    this.verificationCode = hashedOtp.toString()
    this.verificationCodeExpire = Date.now() + 5 * 60 * 1000
    return verificationCode
}


userSchema.methods.generateToken = async function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE

    },
    )
}




userSchema.methods.generateResetToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken;
};





const userModel = mongoose.model("User", userSchema)


module.exports = userModel 