const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const mongoose = require('mongoose');
const User = require("../models/user");

passport.serializeUser((user, done) => {
	// This is roughly like JSON.stringify() for data transmission over network.
	// user: user.id -> id created by mongodb (Not user._id)
	done(null, user.id); // Pass id to client.
});

passport.deserializeUser((id, done) => {
	// This is roughly like JSON.parse() for data transmission over network.
	// Get id from client, and fetch user and then pass it with done.
	User.findById(id).then(user => {
		done(null, user);
	})
});

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: "/auth/google/callback"
		},
		(accessToken, refreshToken, profile, done) => {
			// Check if user already exists:
			User.findOne({ googleid: profile.id }).then(curUser => {
				if (curUser) {
					// User already in the database:
					console.log("Current User => ", curUser);
					done(null, curUser); // Call passport.serialize()
				} else {
					// User not found, add to the database:
					const newUser = User({
						_id: new mongoose.Types.ObjectId(),
						googleid: profile.id,
						username: profile.displayName,
					})
					newUser.save().then(newUser => {
						console.log("New User => ", newUser);
						done(null, newUser); // Call passport.serialize()
					})
				}
			})

			// var userData = {
			// 	email: profile.emails[0].value,
			// 	name: profile.displayName,
			// 	token: accessToken
			// };
			// done(null, userData);
		}
	)
);
