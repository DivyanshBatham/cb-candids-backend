const jwt = require('jsonwebtoken');

const jwtAuthCheck = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];

    if (typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(' ')[1];

        jwt.verify(bearerToken, process.env.JWT_SECRET, (err, payload) => {
            if (err)
                res.status(401).json({
                    "success": false,
                    "errors": "Access Token is invalid"
                });
            else {
                if (payload.type === 'access') {
                     if (!payload.emailVerified) {
                        res.status(403).json({
                            "success": false,
                            "errors": "Email not verified"
                        });
                    } else {
                        req.userId = payload.sub;
                    }
                    next();
                } else {
                    res.status(403).json({
                        "success": false,
                        "errors": "Provided token is not Access Token"
                    });
                }
            }
        })
    } else {
        res.status(401).json({
            "success": false,
            "errors": "Access Token is required"
        });
    }
}

module.exports = jwtAuthCheck