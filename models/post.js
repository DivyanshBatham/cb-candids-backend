const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    taggedUsers: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], required: true },
    imgSrc: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], required: true },
    comments: [
        {
            comment: { type: String, required: true },
            author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            likes: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], required: true },
        }
    ]
})

module.exports = mongoose.model('Post', postSchema)