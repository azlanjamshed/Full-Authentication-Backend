const twilio = require("twilio");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)

async function sendVerificationCode(
    verificationMethod,
    verificationCode,
    email,
    phone,
    name
) {
    verificationMethod = verificationMethod?.trim().toLowerCase();
    try {
        // EMAIL VERIFICATION
        if (verificationMethod === "email") {
            const message = generateEmailTemplate(verificationCode, name);

            await sendEmail({
                email,
                subject: "Your verification code",
                message,
            });

            return;
        }

        // PHONE VERIFICATION (TWILIO)
        if (verificationMethod === "phone") {
            const verificationCodeWithSpace =
                verificationCode.toString().split("").join(" ");

            // OTP through message--------------------------->



            await client.messages.create({
                body: `Your verification code is ${verificationCodeWithSpace}`,
                from: process.env.TWILI_PHONE_NUMBER,
                to: phone,
            });



            //OTP through  call----------------->



            //     await client.calls.create({
            //         twiml: `
            //   <Response>
            //     <Say voice="alice">
            //       Hello ${name}.
            //       Your verification code is ${verificationCodeWithSpace}.
            //       I repeat, ${verificationCodeWithSpace}.
            //     </Say>
            //   </Response>
            // `,
            //         from: process.env.TWILI_PHONE_NUMBER, // MUST be Twilio voice number
            //         to: phone,                      // MUST be verified
            //     });
            return;
        }

        // INVALID METHOD
        throw new Error("INVALID_VERIFICATION_METHOD");
        // console.error("❌ INVALID METHOD VALUE:", verificationMethod);
        return;
    } catch (error) {
        console.error("SEND VERIFICATION ERROR 👉", error);
        throw new Error("SEND_VERIFICATION_FAILED");
    }
}


function generateEmailTemplate(verificationCode, name) {
    return `<div class="content"> <p>Hello <strong>${name}</strong>,</p> <p> Thank you for registering with us. Please use the verification code below to confirm your account. </p> <div class="otp-box"> <div class="otp">${verificationCode}</div> </div> <p> This code will expire in <strong>5 minutes</strong>. Please do not share this code with anyone. </p> <p> If you did not create an account, you can safely ignore this email. </p> <p>Best regards,<br/> <strong>Your App Team</strong></p> </div> <div class="footer"> © 2025 Your App Name. All rights reserved. </div>`
}

module.exports = sendVerificationCode