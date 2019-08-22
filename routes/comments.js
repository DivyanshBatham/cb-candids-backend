const express = require('express');
const Post = require('../models/post');
const jwtAuthCheck = require('../helpers/jwtAuthCheck');
const commentsRouter = express.Router({ mergeParams: true });


// BASE URL = /:postId/comments
// Comment Comment:
commentsRouter.post("/", jwtAuthCheck, (req, res) => {
    const { postId } = req.params;
    let { comment = "" } = req.body;
    const errors = {};

    // Data Validations:
    // Removing Trailing & Leading Spaces:
    comment = comment.replace(/^(\s*)/, '').replace(/(\s*)$/, '');
    // Now Check for Comment:
    if (!comment) {
        errors.comment = "Comment cannot be Empty";
    }

    // Data is Invalid, respond immediately. (Prevents DB Attacks)
    if (!(Object.entries(errors).length === 0 && errors.constructor === Object)) {
        res.status(400).json({
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
        ).then(post => {
            console.log("Commented on Post => ", post);
            if (post)
                res.status(201).json({
                    "success": true,
                    "data": post
                });
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
            let commentFound = false;
            for (let comment of post.comments) {
                if (comment.id === commentId) {
                    if (!comment.likes.includes(req.userId)) {
                        comment.likes.push(req.userId);
                        commentFound = true;
                        break;
                    }
                }
            }
            if (commentFound) {
                post.save().then(post => {
                    // HELP: Should I be sending the updated post or not?
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
commentsRouter.delete("/:commentId", jwtAuthCheck, (req, res) => {
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
commentsRouter.patch("/:commentId", jwtAuthCheck, (req, res) => {
    const { postId, commentId } = req.params;
    let { comment = "" } = req.body;

    const errors = {};

    // Removing Trailing & Leading Spaces:
    comment = comment.replace(/^(\s*)/, '').replace(/(\s*)$/, '');
    // Now Check for Comment:
    if (!comment) {
        errors.comment = "Comment cannot be Empty";
    } 

    if (!(Object.entries(errors).length === 0 && errors.constructor === Object)) {
        // Data is Invalid, respond immediately.
        res.status(400).json({
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

