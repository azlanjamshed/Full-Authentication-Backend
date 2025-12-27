// const sendEmail = require("../../utils/sendEmail");
const sendToken = require("../../utils/sendToken");
const catchAsyncError = require("../middleware/catchAsyncError");
const crypto = require("crypto")
const { ErrorHandler } = require("../middleware/error");
const userModel = require("../models/user.Model");
// const twilio = require("twilio");
const sendVerificationCode = require("../../utils/sendVerificationCode");
const sendEmail = require("../../utils/sendEmail");

// const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)



const registration = catchAsyncError(async (req, res, next) => {
    try {
        const { name, email, password, phone, verificationMethod } = req.body;
        if (!name || !email || !password || !phone || !verificationMethod) {
            return next(new ErrorHandler("Al field are required", 400))
        }
        function validatePhoneNumber(phone) {
            const phoneRegex = /^\+91\d{10}$/
            return phoneRegex.test(phone)
        }

        if (!validatePhoneNumber(phone)) {
            return next(new ErrorHandler("Invalid phone number", 400))
        }

        const existingUser = await userModel.findOne({
            $or: [
                {
                    email,
                    accountVerified: true
                }, {
                    phone,
                    accountVerified: true
                }
            ]

        })

        if (existingUser) {
            return next(new ErrorHandler("Phone or Email is already in used", 400))

        }

        const registrationAttemptsByIUser = await userModel.find({
            $or: [
                {
                    phone, accountVerified: false
                }, {
                    email, accountVerified: false
                }
            ]
        })

        if (registrationAttemptsByIUser.length > 3) {
            return next(new ErrorHandler("You have exceed the maximum number of attempt. please try again after an hour", 400))
        }
        const userCount = await userModel.countDocuments();
        const userData = {
            name, email, password, phone, role: userCount === 0 ? "admin" : "user",
        }

        const user = await userModel.create(userData)
        const verificationCode = user.generateVerificationCode()

        await user.save()
        // sendVerificationCode(verificationMethod, verificationCode, email, phone, user.name)
        try {
            await sendVerificationCode(
                verificationMethod,
                verificationCode,
                email,
                phone,
                user.name
            );
        } catch (error) {
            return next(
                new ErrorHandler("Failed to send verification code", 500),


            );
        }

        res.status(200).json({
            success: true
        })
    } catch (error) {
        next(error)
    }
})




const verifyOtp = catchAsyncError(async (req, res, next) => {
    const { email, otp } = req.body
    if (!email || !otp) {
        return next(new ErrorHandler("Email and OTP are required", 400));
    }


    const user = await userModel.findOne({
        email,
        accountVerified: false,
    });
    if (!user) {
        return next(new ErrorHandler("User not found or already verified", 404));
    }
    if (!user.verificationCodeExpire || user.verificationCodeExpire < Date.now()) {
        return next(new ErrorHandler("OTP expired", 400));
    }
    const hashedEnteredOtp = crypto
        .createHash("sha256")
        .update(otp.toString()) // USER input
        .digest("hex");

    if (hashedEnteredOtp !== user.verificationCode) {
        return next(new ErrorHandler("Invalid OTP", 400));
    }
    // if (user.verificationCode !== Number(otp)) {
    //     return next(new ErrorHandler("Invalid OTP", 400));
    // }
    user.accountVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpire = undefined;

    await user.save({ validateModifiedOnly: true });
    sendToken(user, 200, "Account verified successfully", res);


})

const login = catchAsyncError(async (req, res, next) => {

    const { email, password } = req.body

    if (!email || !password) {
        return next(new ErrorHandler("Email and Password are required", 400))
    }

    const user = await userModel.findOne({ email, accountVerified: true }).select("+password");

    if (!user) {
        return next(new ErrorHandler("User not found", 404))
    }
    const validPassword = await user.comparePassword(password)

    if (!validPassword) {
        return next(new ErrorHandler("Email or Password are wrong", 400))
    }

    sendToken(user, 200, "user logged in successful", res)

})



const logout = catchAsyncError(async (req, res, next) => {
    res.status(200).cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    }).json({
        success: true,
        message: "loggedout successfully"
    })
})

const getUSer = catchAsyncError(async (req, res, next) => {
    const user = req.user

    res.status(200).json({
        success: true,
        user
    })
})



const forgotPassword = catchAsyncError(async (req, res, next) => {
    const { email } = req.body
    if (!email) {
        return next(new ErrorHandler("Email is required", 400))
    }

    const user = await userModel.findOne({
        email,
        accountVerified: true
    });

    if (!user) {
        return next(new ErrorHandler("User not fond", 404))
    }
    const resetToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false })
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const message = `Your reset Password Token is- \n\n${resetUrl}\n\n if you not requested this email then please ignore.`

    try {
        await sendEmail({
            email: user.email,
            subject: "MERN Authentication app reset Password",
            message: message
        })
        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`
        })
    } catch (error) {
        user.resetPasswordToken = undefined,
            user.resetPasswordExpire = undefined
        await user.save({ validateBeforeSave: false })
        return next(new ErrorHandler(error.message ? error.message : "cannot send reset token", 500))
    }
})

const resetPassword = catchAsyncError(async (req, res, next) => {
    const { token } = req.params
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex")
    const user = await userModel.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    })
    if (!user) {
        return next(new ErrorHandler("Reset password token is expired or invalid", 400))
    }
    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler("password and confirm password are not same", 400))
    }
    user.password = req.body.password

    user.resetPasswordToken = undefined,
        user.resetPasswordExpire = undefined
    await user.save()
    sendToken(user, 200, "reset password successfully", res)
})


const makeAdmin = async (req, res, next) => {
    const user = await userModel.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    user.role = "admin";
    await user.save();

    res.status(200).json({
        success: true,
        message: "User promoted to admin",
    });
};
//------------------------------------------//

// async function sendVerificationCode(
//     verificationMethod,
//     verificationCode,
//     email,
//     phone,
//     name
// ) {
//     verificationMethod = verificationMethod?.trim().toLowerCase();
//     try {
//         // EMAIL VERIFICATION
//         if (verificationMethod === "email") {
//             const message = generateEmailTemplate(verificationCode, name);

//             await sendEmail({
//                 email,
//                 subject: "Your verification code",
//                 message,
//             });

//             return;
//         }

//         // PHONE VERIFICATION (TWILIO)
//         if (verificationMethod === "phone") {
//             const verificationCodeWithSpace =
//                 verificationCode.toString().split("").join(" ");

//             // OTP through message--------------------------->



//             await client.messages.create({
//                 body: `Your verification code is ${verificationCodeWithSpace}`,
//                 from: process.env.TWILI_PHONE_NUMBER,
//                 to: phone,
//             });



//             //OTP through  call----------------->



//             //     await client.calls.create({
//             //         twiml: `
//             //   <Response>
//             //     <Say voice="alice">
//             //       Hello ${name}.
//             //       Your verification code is ${verificationCodeWithSpace}.
//             //       I repeat, ${verificationCodeWithSpace}.
//             //     </Say>
//             //   </Response>
//             // `,
//             //         from: process.env.TWILI_PHONE_NUMBER, // MUST be Twilio voice number
//             //         to: phone,                      // MUST be verified
//             //     });
//             return;
//         }

//         // INVALID METHOD
//         throw new Error("INVALID_VERIFICATION_METHOD");
//         // console.error("❌ INVALID METHOD VALUE:", verificationMethod);
//         return;
//     } catch (error) {
//         console.error("SEND VERIFICATION ERROR 👉", error);
//         throw new Error("SEND_VERIFICATION_FAILED");
//     }
// }


// function generateEmailTemplate(verificationCode, name) {
//     return `<div class="content"> <p>Hello <strong>${name}</strong>,</p> <p> Thank you for registering with us. Please use the verification code below to confirm your account. </p> <div class="otp-box"> <div class="otp">${verificationCode}</div> </div> <p> This code will expire in <strong>5 minutes</strong>. Please do not share this code with anyone. </p> <p> If you did not create an account, you can safely ignore this email. </p> <p>Best regards,<br/> <strong>Your App Team</strong></p> </div> <div class="footer"> © 2025 Your App Name. All rights reserved. </div>`
// }


module.exports = { registration, verifyOtp, login, logout, getUSer, forgotPassword, resetPassword, makeAdmin }