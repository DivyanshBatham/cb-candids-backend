const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    email: String,
    googleid: String,
    password: String,
    organization: String,
})

module.exports = mongoose.model('User', userSchema)