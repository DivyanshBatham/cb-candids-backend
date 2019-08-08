const express = require('express');
const router = express.Router();
const passport = require("passport");

/* GET Google Authentication API. */
router.get(
	"/google",
	passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
	"/google/callback",
	passport.authenticate("google"),
	// passport.authenticate("google", { failureRedirect: "/", session: false }),
	(req, res) => {
		console.log("ROUTE HANDLER CALLBACK............");
		res.redirect("/loggedin");
		// console.log(req.user);
		// res.send(req.user);
		// req.logIn(req.user, function (err) { // <-- Log user in
		// 	console.log(req.user, err);
		// 	return res.redirect('/'); 
		//  });
		// var token = req.user.token;
		// res.redirect("http://localhost:3000?token=" + token);
	}
);

module.exports = router;
