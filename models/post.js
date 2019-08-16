const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    taggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    imgSrc: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
        {
            comment: String,
            author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        }
    ]
})

module.exports = mongoose.model('Post', postSchema)