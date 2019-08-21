const jwt = require('jsonwebtoken');

const jwtAuthCheck = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];

    if (typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(' ')[1];

        jwt.verify(bearerToken, process.env.JWT_SECRET, (err, payload) => {
            if (err)
                res.status(403).json({
                    "success": false
                });
            else {
                if (payload.type === 'access') {
                    req.userId = payload.sub;
                    next();
                } else {
                    res.status(403).json({
                        "success": false
                    });
                }
            }
        })
    } else {
        res.status(403).json({
            "success": false
        });
    }
}

module.exports = jwtAuthCheck