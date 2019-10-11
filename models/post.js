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

postSchema.path('likes').set(function (newVal) {
    console.log("----------------------- LIKE SETTER -----------------------");
    const prevLikes = this.likes;
    console.log(prevLikes, newVal);
    if (newVal && newVal.length > 0) {
        console.log("SOMEONE IS LIKING A POST");
        this._likedPost = true;
    }
    return newVal;
})

postSchema.path('comments').set(function (newVal) {
    console.log("----------------------- COMMENT SETTER -----------------------");
    const prevComments = this.comments;
    console.log(prevComments, newVal);
    if (newVal) {
        console.log("SOMEONE IS COMMENTING A POST");
        this._commentPost = true;
    }
    return newVal;
})

postSchema.path('taggedUsers').set(function (newTaggedUser) {
    console.log("----------------------- TAGGEDUSERS SETTER -----------------------");
    const prevTaggedUsers = this.taggedUsers;
    console.log(prevTaggedUsers, newTaggedUser);
    if (newTaggedUser) {
        console.log("SOMEONE IS TAGGING A USER IN POST");
        this._taggingUser = true;
    }
    return newTaggedUser;
})


// postSchema.pre('save', function (next, doc) {
//     console.log("----------------------- PRE SAVE -----------------------");
//     // console.log(doc);
//     if (this._likedPost) {
//         console.log("TRIGGER NOTIFICATIONS fOR LIKE")
//     }
//     if (this._commentPost) {
//         console.log("TRIGGER NOTIFICATIONS fOR COMMENT")
//     }
//     next();
// });

postSchema.post('save', function (doc) {
    console.log("----------------------- POST SAVE -----------------------");
    // console.log(doc);
    if (this._likedPost) {
        console.log("TRIGGER NOTIFICATIONS fOR LIKE")
    }
    if (this._commentPost) {
        console.log("TRIGGER NOTIFICATIONS fOR COMMENT")
    }
    if (this._taggingUser) {
        console.log("TRIGGER NOTIFICATIONS fOR TAGGING")
    }
    console.log("\n\n\n\n\n\n\n\n\n");
});

// postSchema.post('remove', function (doc) {
//     console.log("----------------------- POST REMOVE -----------------------");
//     console.log('%s has been removed', doc._id);
// });

// postSchema.post('findOneAndDelete', function (doc) {
//     console.log("----------------------- POST REMOVE -----------------------");
//     console.log('%s has been removed', doc._id);
// });


module.exports = mongoose.model('Post', postSchema)