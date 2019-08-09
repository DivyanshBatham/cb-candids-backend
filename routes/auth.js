const express = require('express');
const router = express.Router();
const passport = require("passport");
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/user.js')

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

})

router.post("/register", (req, res) => {
	const { email, username, password, organization } = req.body;
	const errors = {};
	// Data Validations:
	// Valid Username:
	// if (check_for_username)
	// 	errors.email = "Invalid Username";

	// // Valid Email:
	// if (check_for_email)
	// 	errors.email = "Invalid Email";

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

				const newUser = new User({
					_id: new mongoose.Types.ObjectId(),
					username: username,
					email: email,
					password: password,
					organization: organization
				})

				newUser.save()
					.then(user => {
						console.log("New User => ", user, typeof user);

						const jwtToken = jwt.sign(
							{ sub: user.id },
							process.env.JWT_SECRET,
							{ expiresIn: '30s' }
						);

						console.log(jwtToken);

						res.status(200).json({
							"success": true,
							"data": {
								// TODO, send JWT Token
								user: user,
								token: jwtToken
							}
						})
					})
					.catch(err => console.err(err))

			}
		})

	}

})

module.exports = router;
