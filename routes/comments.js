const express = require('express');
const Post = require('../models/post');
const jwtAuthCheck = require('../helpers/jwtAuthCheck');
const commentsRouter = express.Router({mergeParams: true});


// BASE URL = /:postId/comments
// Comment Comment:
commentsRouter.post("/", jwtAuthCheck, (req, res) => {
    console.log(">>>>>> HERE: ");
    console.log(">>>>>> req.params: ", req.params);
    const { postId } = req.params;
    const { comment } = req.body;

    // TODO: Validate comment.

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
            res.status(200).json({
                "success": true,
                "data": post
            });
        else
            res.status(200).json({
                "success": false,
                "errors": ["Post not Found"]
            });
    }).catch(err => {
        console.log(err)
        res.status(200).json({
            "success": false,
            "errors": ["Post not Found"]
        });
    })

});

// Like Comment:
commentsRouter.post("/:commentId/likes", jwtAuthCheck, (req, res) => {
    const { postId, commentId } = req.params;

    Post.findById(postId).then(post => {
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
                res.status(200).json({
                    "success": true,
                    "data": post
                });
            }).catch(err => {
                console.log(err)
                res.status(200).json({
                    "success": false,
                    "errors": ["Unable to Like Comment"]
                });
            });
        } else {
            res.status(200).json({
                "success": false,
                "errors": ["Comment Not Found"]
            });
        }

    }).catch(err => {
        console.log(err)
        res.status(200).json({
            "success": false,
            "errors": ["Post not Found"]
        });
    });
});

// Delete Comment:
commentsRouter.delete("/:commentId", jwtAuthCheck, (req, res) => {
    const { postId, commentId } = req.params;

    Post.findById(postId).then(post => {
        post.comments = post.comments.filter(comment => comment.id !== commentId);
        post.save().then(post => {
            res.status(200).json({
                "success": true,
                "data": post
            });
        }).catch(err => {
            console.log(err)
            res.status(200).json({
                "success": false,
                "errors": ["Unable to delete Comment"]
            });
        });
    }).catch(err => {
        console.log(err)
        res.status(200).json({
            "success": false,
            "errors": ["Post not Found"]
        });
    });

});

// Edit Comment:
commentsRouter.patch("/:commentId", jwtAuthCheck, (req, res) => {
    const { postId, commentId } = req.params;
    const { newComment } = req.body;

    const changes = {}, errors = {};

    if (newComment !== undefined) {
        if (newComment === "")
            errors.comment = "Comment cannot be Empty";
        else
            changes.comment = newComment;
    }

    if (!(Object.entries(errors).length === 0 && errors.constructor === Object)) {
        // Data is Invalid, respond immediately.
        res.status(200).json({
            "success": false,
            "errors": errors,
        });
    } else if (!(Object.entries(changes).length === 0 && changes.constructor === Object)) {
        Post.findById(postId).then(post => {
            let commentFound = false;
            for (let commentObj of post.comments) {
                if (commentObj.id === commentId) {
                    commentObj.comment = newComment;
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
                    res.status(200).json({
                        "success": false,
                        "errors": ["Unable to edit Comment"]
                    });
                });
            } else {
                res.status(200).json({
                    "success": false,
                    "errors": ["Comment not Found"]
                });
            }
        }).catch(err => {
            console.log(err)
            res.status(200).json({
                "success": false,
                "errors": ["Post not Found"]
            });
        });
    } else {
        res.status(200).json({
            "success": false,
            "errors": ["No changes"]
        });
    }

});


module.exports = commentsRouter;

