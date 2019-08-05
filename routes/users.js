var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user.js')

/* GET users listing. */
router.get('/', function (req, res, next) {
  User.find({}).then(res => console.log(res));

  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name: "Name",
    email: "Email"
  })
  
  // Turns into promise:
  user.save().then(result => {
    console.log(result);
  })
  .catch(err => console.err(err))
  
  res.status(201).json({
    message: "User create Successfully",
    createdUser: user
  });

});

module.exports = router;
