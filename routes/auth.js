const express = require('express');
const router = express.Router();
const passport = require("passport");
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const User = require('../models/user.js')

const mailTransport = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.NODE_MAILER_EMAIL,
		pass: process.env.NODE_MAILER_PASSWORD
	}
});

/* GET Google Authentication API. */
router.get(
	"/google",
	passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
	"/google/callback",
	// passport.authenticate("google"),
	// passport.authenticate("google", { failureRedirect: "/", session: false }),
	(req, res) => {
		console.log("ROUTE HANDLER CALLBACK............");
		res.send("Test");
		// res.redirect("/loggedin");
		// console.log(req.user);
		// req.logIn(req.user, function (err) { // <-- Log user in
		// 	console.log(req.user, err);
		// 	return res.redirect('/'); 
		//  });
		// var token = req.user.token;
		// res.redirect("http://localhost:3000?token=" + token);
	}
);

router.post("/login", (req, res) => {
	const { email, password } = req.body;

	User.findOne({ email: email }).then(user => {
		if (user) {
			if (bcrypt.compareSync(password, user.password)) {

				const jwtToken = jwt.sign(
					{ sub: user.id },
					process.env.JWT_SECRET,
					// { expiresIn: '30s' }
				);

				res.status(200).json({
					"success": true,
					"data": {
						user: {
							email: user.email,
							username: user.username,
							organization: user.organization
						},
					},
					"token": jwtToken
				});

			} else {
				res.status(400).send("Invalid Password")
			}
		} else {
			res.status(400).send("Cannot find user")
		}
	})
})

router.post("/register", (req, res) => {
	const { email, username, password, organization } = req.body;
	const errors = {};
	// Data Validations:
	// Check for Username:
	if (!/^\w{3,}$/.test(username))
		errors.email = "Invalid Username";

	// Check for Email:
	if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email))
		errors.email = "Invalid Email";

	// Check for Password:
	// if (check_for_password)
	// 	errors.password = "Doesn't meet the conditions";

	// Data is Invalid, respond immediately. (Prevents DB Attacks)
	if (!(Object.entries(errors).length === 0 && errors.constructor === Object)) {
		console.log("Inside");
		res.status(200).json({
			"success": false,
			"errors": errors
		});

	} else {

		User.find({ $or: [{ 'email': email }, { 'username': username }] }).then(users => {
			console.log(users);
			if (users.length > 0) {

				// Checking for duplication:
				users.forEach(user => {
					if (user.email === email)
						errors.email = "Email already exists";
					if (user.username === username)
						errors.username = "Username already exists";
				})

				res.status(200).json({
					"success": false,
					"errors": errors
				});

			} else {

				bcrypt.hash(password, +process.env.BCRYPT_SALT_ROUNDS)
					.then(hashedPassword => {

						const newUser = new User({
							_id: new mongoose.Types.ObjectId(),
							username: username,
							email: email,
							password: hashedPassword,
							organization: organization,
							emailVerified: false
						})

						newUser.save()
							.then(user => {

								const jwtToken = jwt.sign(
									{ sub: user.id },
									process.env.JWT_SECRET,
									// { expiresIn: '30s' }
								);

								res.status(200).json({
									"success": true,
									"data": {
										user: {
											email: user.email,
											username: user.username,
											organization: user.organization
										},
									},
									"token": jwtToken
								})
							})
							.catch(err => console.err(err))

					}); // Bcrypt
			} // Else
		}) // Duplication Check
	} // Data Sanitization
})


router.post("/forgetPassword", (req, res) => {
	const { email } = req.body;

	User.findOne({ email: email }).then(user => {
		if (user) {

			// Generate token using userId:
			const resetPasswordToken = jwt.sign(
				{ sub: user.id },
				process.env.JWT_SECRET,
				{ expiresIn: '10m' } // Reset Link will be valid for only 5 mins.
			);

			// Send an email with generated Token:
			const mailOptions = {
				from: `"Candids" <${process.env.NODE_MAILER_EMAIL}>`,
				to: email,
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
						href="https://localhost:8080/resetPassword/?token=${resetPasswordToken}"
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

			mailTransport
				.sendMail(mailOptions)
				.then(response => {
					console.log(`Password Reset link sent to: ${email}`);
					res.status(200).json({
						"success": true,
					});
				})
				.catch(err => {
					console.error(err);
					res.status(200).json({
						"success": false,
					});
				});

		} else {
			res.status(400).send("Cannot find user")
		}
	})
})

router.post("/resetPassword", (req, res) => {
	const { password, token } = req.body;

	// Verify Token:
	jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
		if (err)
			res.status(403).json({
				"success": false
			});
		else {

			bcrypt.hash(password, +process.env.BCRYPT_SALT_ROUNDS)
				.then(hashedPassword => {

					User.findByIdAndUpdate(payload.sub, {
						password: hashedPassword
					}).then(user => {
						const jwtToken = jwt.sign(
							{ sub: user.id },
							process.env.JWT_SECRET,
							// { expiresIn: '30s' }
						);

						res.status(200).json({
							"success": true,
							"data": {
								user: {
									email: user.email,
									username: user.username,
									organization: user.organization
								},
							},
							"token": jwtToken
						})
					}).catch(err => console.err(err))

				}); // Bcrypt

		} // Else
	})
})


module.exports = router;
