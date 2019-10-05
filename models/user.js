const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },
    emailVerified: { type: Boolean, required: true },
    organization: { type: String, default: 'CodeBrahma', select: false },
    imgSrcLarge: { type: String, default: '/images/userPlaceholder.jpg' },
    imgSrc: { type: String, default: '/images/userPlaceholder.jpg' },
    bio: { type: String, default: '' },
    googleid: { type: String },
})

module.exports = mongoose.model('User', userSchema)