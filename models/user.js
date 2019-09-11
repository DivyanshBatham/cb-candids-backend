const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    emailVerified: { type: Boolean, required: true },
    organization: { type: String, default: 'CodeBrahma' },
    imgSrc: { type: String, default: '/images/userPlaceholder.png' },
    bio: { type: String, default: '' },
    // TODO: Change the imgSrc of placeholder to cloudURL
    googleid: { type: String },
})

module.exports = mongoose.model('User', userSchema)