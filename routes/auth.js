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
		res.send(req.user);
		// var token = req.user.token;
		// res.redirect("http://localhost:3000?token=" + token);
	}
);

module.exports = router;
