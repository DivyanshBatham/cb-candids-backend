const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    emailVerified: { type: Boolean, required: true },
    organization: { type: String, required: true, default: 'CodeBrahma' },
    imgSrc: { type: String, required: true, default: '/images/userPlaceholder.png' },
    // TODO: Change the imgSrc of placeholder to cloudURL
    googleid: { type: String },
})

module.exports = mongoose.model('User', userSchema)