const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// const authCheck = (req, res, next) => {
//     if (!req.user) {
//         res.redirect('auth/login');
//     } else {
//         next();
//     }
// }

// Format of Token:
// Authorization: Bearer <jwt_token>

// Verify JWT Token:
const jwtAuthCheck = (req, res, next) => {
    // Get Auth Header Value:
    const bearerHeader = req.headers['authorization'];
    console.log("BEARER HEADER => ", bearerHeader);

    if (typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(' ')[1];

        jwt.verify(bearerToken, process.env.JWT_SECRET, (err, payload) => {
            if (err)
                res.status(403).json({
                    "success": false
                });
            else {
                console.log("JWT VERIFIED => ", payload);
                req.userId = payload.sub;
                next();
            }
        })
    } else {
        // Forbidden:
        res.status(403).json({
            "success": false
        });
    }
}

router.get("/", jwtAuthCheck, (req, res) => {
    console.log("User Id => ", req.userId, typeof req.userId);
    User.findById(req.userId)
        .then((user) => {
            console.log(user);
            res.send("You are logged in.");
        }).catch(err => console.log(err))
});

module.exports = router;
