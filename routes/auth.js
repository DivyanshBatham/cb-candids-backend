const express = require('express');
const router = express.Router();
const passport = require("passport");
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user.js')
const sendVerificationEmail = require('../helpers/sendVerificationEmail');
const sendForgetPasswordEmail = require('../helpers/sendForgetPasswordEmail');

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

				const accessToken = jwt.sign(
					{
						sub: user.id,
						emailVerified: user.emailVerified,
						type: "access"
					},
					process.env.JWT_SECRET,
					// { expiresIn: '30s' }
				);

				res.status(200).json({
					"success": true,
					"data": {
						user: {
							email: user.email,
							username: user.username,
							organization: user.organization,
							emailVerified: user.emailVerified
						},
					},
					"token": accessToken
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
							// TODO: When Scaling remove this:
							// organization: organization,
							emailVerified: false
						})

						newUser.save()
							.then(user => {

								const accessToken = jwt.sign(
									{
										sub: user.id,
										emailVerified: user.emailVerified,
										type: "access"
									},
									process.env.JWT_SECRET,
									// { expiresIn: '30s' }
								);

								sendVerificationEmail(user)
									.then(response => {
										console.log(`>>> Email Verification link sent to: ${user.email}`);
										res.status(200).json({
											"success": true,
											"data": {
												user: {
													email: user.email,
													username: user.username,
													organization: user.organization,
													emailVerified: user.emailVerified
												},
											},
											"token": accessToken
										})
									})
									.catch(err => {
										console.error(err);
									});

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
			sendForgetPasswordEmail(user)
				.then(response => {
					console.log(`>>> Password Reset link sent to: ${user.email}`);
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
			if (payload.type === 'reset') {

				bcrypt.hash(password, +process.env.BCRYPT_SALT_ROUNDS)
					.then(hashedPassword => {

						User.findByIdAndUpdate(payload.sub, {
							password: hashedPassword
						}).then(user => {
							const accessToken = jwt.sign(
								{
									sub: user.id,
									emailVerified: user.emailVerified,
									type: "access"
								},
								process.env.JWT_SECRET,
								// { expiresIn: '30s' }
							);

							res.status(200).json({
								"success": true,
								"data": {
									user: {
										email: user.email,
										username: user.username,
										organization: user.organization,
										emailVerified: user.emailVerified
									},
								},
								"token": accessToken
							})
						}).catch(err => console.err(err))

					});

			} else {
				res.status(403).json({
					"success": false
				});
			}
		}
	})
})

router.post("/verifyEmail", (req, res) => {
	const { token } = req.body;

	// Verify Token:
	jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
		if (err)
			res.status(403).json({
				"success": false
			});
		else {
			if (payload.type === 'verification') {

				User.findByIdAndUpdate(
					payload.sub,
					{ $set: { emailVerified: true } },
					{ new: true }
				).then(user => {

					const newAccessToken = jwt.sign(
						{
							sub: user.id,
							emailVerified: user.emailVerified,
							type: "access"
						},
						process.env.JWT_SECRET,
						// { expiresIn: '30s' }
					);

					res.status(200).json({
						"success": true,
						"data": {
							user: {
								email: user.email,
								username: user.username,
								organization: user.organization,
								emailVerified: user.emailVerified
							},
						},
						"token": newAccessToken
					})
				}).catch(err => console.err(err))


			} else {
				res.status(403).json({
					"success": false
				});
			}
		}
	})
})

module.exports = router;
