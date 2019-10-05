const express = require('express');
const Post = require('../models/post');
const User = require('../models/user');
const { jwtAuthCheck, authorizationCheck } = require('./middlewares');
const commentsRouter = express.Router({ mergeParams: true });


// BASE URL = /:postId/comments
// Comment Comment:
commentsRouter.post("/", jwtAuthCheck, (req, res) => {
    const { postId } = req.params;
    let { comment = "" } = req.body;
    const errors = {};

    // Data Validations:
    // Removing Trailing & Leading Spaces:
    comment = comment.trim();
    // Now Check for Comment:
    if (!comment) {
        errors.comment = "Comment is required";
    }

    // Data is Invalid, respond immediately. (Prevents DB Attacks)
    if (!(Object.entries(errors).length === 0 && errors.constructor === Object)) {
        res.status(422).json({
            "success": false,
            "errors": errors
        });

    } else {
        Post.findByIdAndUpdate(
            postId,
            {
                $push: {
                    comments: {
                        comment: comment,
                        author: req.userId,
                        likes: [],
                    }
                }
            },
            { new: true }
        )
            .populate({ path: 'comments.author', model: User, select: ['username', 'imgSrc'] })
            .lean() // Returns a plain `post` JS Object instead of Mongoose Object
            .then(post => {
                if (post) {
                    res.status(201).json({
                        "success": true,
                        "data": {
                            ...post,
                            comments: post.comments.map(comment => ({
                                ...comment,
                                isAuthor: comment.author._id.toString() === req.userId
                            })),
                            isLiked: post.likes.findIndex( like => like._id.toString() === req.userId ) !== -1
                        }
                    });
                }
                else
                    res.status(404).json({
                        "success": false,
                        "errors": "Post not Found"
                    });
            }).catch(err => {
                console.log(err)
                res.status(500).json({
                    "success": false,
                    "errors": err.message
                });
            })
    }

});

// Like Comment:
commentsRouter.post("/:commentId/likes", jwtAuthCheck, (req, res) => {
    const { postId, commentId } = req.params;

    Post.findById(postId).then(post => {
        if (post) {
            let message;
            let commentFound = false;
            for (let comment of post.comments) {
                if (comment.id === commentId) {
                    const likeIndex = comment.likes.indexOf(req.userId);
                    if (likeIndex === -1) {
                        message = "liked";
                        comment.likes.push(req.userId);
                    }
                    else {
                        message = "unliked";
                        comment.likes.splice(likeIndex, 1);
                    }
                    commentFound = true;
                    break;
                    // if (!comment.likes.includes(req.userId)) {
                    //     comment.likes.push(req.userId);
                    //     commentFound = true;
                    //     break;
                    // }
                }
            }
            if (commentFound) {
                post.save().then(post => {
                    // HELP: Should I be sending the updated post or not?
                    res.status(200).json({
                        "success": true,
                        "data": post,
                        "message": message
                    });
                }).catch(err => {
                    console.log(err)
                    res.status(500).json({
                        "success": false,
                        "errors": err.message
                    });
                });
            } else {
                res.status(404).json({
                    "success": false,
                    "errors": "Comment Not Found"
                });
            }
        } else {
            res.status(404).json({
                "success": false,
                "errors": "Post not Found"
            });
        }
    }).catch(err => {
        console.log(err)
        res.status(500).json({
            "success": false,
            "errors": err.message
        });
    });
});

// Delete Comment:
commentsRouter.delete("/:commentId", jwtAuthCheck, authorizationCheck, (req, res) => {
    const { postId, commentId } = req.params;

    Post.findById(postId).then(post => {
        if (post) {
            const totalCommentsBeforeDeletion = post.comments.length;
            post.comments = post.comments.filter(comment => comment.id !== commentId);
            if (post.comments.length !== totalCommentsBeforeDeletion) {
                post.save().then(post => {
                    res.status(200).json({
                        "success": true,
                    });
                }).catch(err => {
                    console.log(err)
                    res.status(500).json({
                        "success": false,
                        "errors": err.message
                    });
                });
            } else {
                res.status(404).json({
                    "success": false,
                    "errors": "Comment not Found"
                });
            }
        } else {
            res.status(404).json({
                "success": false,
                "errors": "Post not Found"
            });
        }
    }).catch(err => {
        console.log(err)
        res.status(500).json({
            "success": false,
            "errors": err.message
        });
    });

});

// Edit Comment:
commentsRouter.patch("/:commentId", jwtAuthCheck, authorizationCheck, (req, res) => {
    const { postId, commentId } = req.params;
    let { comment = "" } = req.body;

    const errors = {};

    // Removing Trailing & Leading Spaces:
    comment = comment.replace(/^(\s*)/, '').replace(/(\s*)$/, '');
    // Now Check for Comment:
    if (!comment) {
        errors.comment = "Comment is required";
    }

    if (!(Object.entries(errors).length === 0 && errors.constructor === Object)) {
        // Data is Invalid, respond immediately.
        res.status(422).json({
            "success": false,
            "errors": errors,
        });
    } else {
        Post.findById(postId).then(post => {
            if (post) {
                let commentFound = false;
                for (let commentObj of post.comments) {
                    if (commentObj.id === commentId) {
                        commentObj.comment = comment;
                        commentFound = true;
                        break;
                    }
                }
                if (commentFound) {
                    post.save().then(post => {
                        res.status(200).json({
                            "success": true,
                            "data": post
                        });
                    }).catch(err => {
                        console.log(err)
                        res.status(500).json({
                            "success": false,
                            "errors": err.message
                        });
                    });
                } else {
                    res.status(404).json({
                        "success": false,
                        "errors": "Comment not Found"
                    });
                }
            } else {
                res.status(404).json({
                    "success": false,
                    "errors": "Post not Found"
                });
            }
        }).catch(err => {
            console.log(err)
            res.status(500).json({
                "success": false,
                "errors": err.message
            });
        });
    }
});


module.exports = commentsRouter;

