const mongoose = require('mongoose');

const userModel = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String
})

module.exports = mongoose.model('User', userModel)