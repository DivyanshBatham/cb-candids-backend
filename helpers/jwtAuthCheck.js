const jwt = require('jsonwebtoken');

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

module.exports = jwtAuthCheck