const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.status(418).json({
    message: "I'm a teapot"
  });
});

module.exports = router;
