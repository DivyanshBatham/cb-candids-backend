const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwtAuthCheck = require('../middlewares/jwtAuthCheck');

router.get("/", jwtAuthCheck, (req, res) => {
    console.log("User Id => ", req.userId, typeof req.userId);
    User.findById(req.userId)
        .then((user) => {
            console.log(user);
            res.send("You are logged in.");
        }).catch(err => console.log(err))
});

module.exports = router;
