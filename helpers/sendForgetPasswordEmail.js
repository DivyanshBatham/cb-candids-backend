const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");

const mailTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.NODE_MAILER_EMAIL,
        pass: process.env.NODE_MAILER_PASSWORD
    }
});


const sendForgetPasswordEmail = (user) => {
    // Generate token using userId:
    const resetPasswordToken = jwt.sign(
        {
            sub: user.id,
            type: "reset"
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m' } // Reset Link will be valid for only 5 mins.
    );

    // Send an email with generated Token:
    const mailOptions = {
        from: `"Candids" <${process.env.NODE_MAILER_EMAIL}>`,
        to: user.email,
        subject: "Candids - Reset Password",
        text: "Candids - Reset Password",
        // html: `Click here to reset your password ${resetPasswordToken}`
        html: `
				<div
					class="email-background"
					style="background: whitesmoke;font-family: sans-serif;text-align: center;font-size: 15px;padding: 14px 18px;"
				>
					<a
						href="https://localhost:8080"
						target="_blank"
						rel="noopener noreferrer"
						class="email-header"
						style="text-decoration: none;color: #606060;"
					>
						<div class="header" style="font-weight: 800;font-size: 1.5em;">
						Candids
						</div>
						<div class="subHeader" style="font-size: 1.1em;">
						Sharing fun Moments
						</div>
					</a>

					<div
						class="email-container"
						style="max-width: 650px;margin: 16px auto;background: white;padding: 32px;text-align: center;border-radius: 5px;"
					>
						<h1 style="font-size: 1.7em;margin-bottom: 1em;color: #323232;">
						Reset Password
						</h1>
						<p style="line-height: 1.2em;color: #505050;">
						Hey ${user.username}! We got a request to reset your Candids password.
						</p>

						<a
						class="cta"
						href="http://localhost:8080/resetPassword/${resetPasswordToken}"
						style="color: white;font-weight: 500;transition: all 0.2s ease-in-out;text-decoration: none;background: #0fc96c;display: inline-block;font-size: 1.2em;padding: 0.7em 1em;border-radius: 10em;margin: 1em 0;box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.6);line-height: 1em;"
						>Choose a new password</a
						>
						<p style="line-height: 1.2em;color: #505050;">
						This link is only valid for 10 minutes.
						</p>

						<hr style="border: 0;border-top: 2px solid whitesmoke;margin: 30px;" />
						<p
						class="note"
						style="line-height: 1.2em;color: #505050;margin-top: 3em;font-size: 0.9em;"
						>
						NOTE: If this wasn't you, you can simply ignore this email.
						</p>
					</div>
				</div>`
    };

    return mailTransport
        .sendMail(mailOptions)
        

}

module.exports = sendForgetPasswordEmail