const express = require('express');
const router = express.Router();

const authCheck = (req, res, next) => {
    if (!req.user) {
        res.redirect('auth/login');
    } else {
        next();
    }
}

router.get("/", authCheck, (req, res) => {
    console.log(req.user);
    res.send("You are logged in.");
});

module.exports = router;
