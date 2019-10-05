const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const Post = require('../models/post');
const User = require('../models/user');
const { jwtAuthCheck, authorizationCheck } = require('./middlewares');
const postsRouter = express.Router();
const commentsRouter = require('./comments');
const upload = require('../helpers/multer');
const aws = require('../helpers/aws');

// Fetch all Posts:
postsRouter.get("/", jwtAuthCheck, (req, res) => {
    Post.find()
        .populate({ path: 'author', model: User, select: ['username', 'imgSrc'] })
        .populate({ path: 'likes', model: User, select: ['username', 'imgSrc'] })
        .populate({ path: 'taggedUsers', model: User, select: ['username', 'imgSrc'] })
        .populate({ path: 'comments.author', model: User, select: ['username', 'imgSrc'] })
        .populate({ path: 'comments.likes', model: User, select: ['username', 'imgSrc'] })
        .lean().then(posts => {
            res.status(200).json({
                "success": true,
                "data": {
                    posts: posts.map(post => {
                        return {
                            ...post,
                            comments: post.comments.map(comment => ({
                                ...comment,
                                isAuthor: comment.author._id.toString() === req.userId
                            })),
                            isLiked: post.likes.findIndex(like => like._id.toString() === req.userId) !== -1
                        }
                    }),
                },
            });
        }).catch(err => {
            console.log(err)
            res.status(500).json({
                "success": false,
                "errors": err.message
            });
        })
});

// Create Post:
postsRouter.post("/", jwtAuthCheck, upload.single('imgSrc'), (req, res) => {
    const { title, description = "", taggedUsers = "[]" } = req.body;
    const errors = {};
    let taggedUsersArray;

    // Validation for empty data:
    if (!title)
        errors.title = "Title is required";
    if (!req.file)
        errors.file = "Image is required";
    try {
        taggedUsersArray = JSON.parse(taggedUsers.length === 0 ? "[]" : taggedUsers);
    } catch (err) {
        errors.taggedUsers = err.message
    };

    // Data is Invalid, respond immediately.
    if (!(Object.entries(errors).length === 0 && errors.constructor === Object)) {
        res.status(422).json({
            "success": false,
            "errors": errors
        });

        // Errors found, no need to keep the file:
        if (req.file)
            fs.unlink(req.file.path, (err) => {
                if (err) console.log("Error deleting the file: ", err);
                else console.log(req.file.path, ' was deleted');
            });

    } else {
        // Upload file to S3:
        aws.s3Upload("posts/", req.file.path).then(location => {
            const newPost = new Post({
                _id: new mongoose.Types.ObjectId(),
                title: title,
                description: description,
                taggedUsers: taggedUsersArray,
                imgSrc: location,
                author: req.userId,
                likes: [],
                comments: []
            })

            newPost.save().then(post => {
                res.status(201).json({
                    "success": true,
                    "data": {
                        post: post,
                    },
                });
            }).catch(err => {
                console.log(err)
                res.status(500).json({
                    "success": false,
                    "errors": err.message
                });
            })

        }).catch(err => {
            // TODO: Possibly retry to upload.
            console.log(err)
            res.status(500).json({
                "success": false,
                "errors": err.message
            });
        })
    }
});

// Fetch specific Post:
postsRouter.get("/:postId", jwtAuthCheck, (req, res) => {
    const { postId } = req.params;

    Post.findById(postId)
        .populate({ path: 'author', model: User, select: ['username', 'imgSrc'] })
        .populate({ path: 'likes', model: User, select: ['username', 'imgSrc'] })
        .populate({ path: 'taggedUsers', model: User, select: ['username', 'imgSrc'] })
        .populate({ path: 'comments.author', model: User, select: ['username', 'imgSrc'] })
        .populate({ path: 'comments.likes', model: User, select: ['username', 'imgSrc'] })
        .lean().then(post => {
            console.log(post);
            if (post)
                res.status(200).json({
                    "success": true,
                    "data": {
                        post: {
                            ...post,
                            comments: post.comments.map(comment => ({
                                ...comment,
                                isAuthor: comment.author._id.toString() === req.userId
                            })),
                            isLiked: post.likes.findIndex(like => like._id.toString() === req.userId) !== -1
                        }
                    }
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
});


// Delete Post:
postsRouter.delete("/:postId", jwtAuthCheck, authorizationCheck, (req, res) => {
    const { postId } = req.params;

    Post.findOneAndDelete({
        _id: postId,
        author: req.userId
    }).then(deletedPost => {
        if (deletedPost) {
            const curKey = deletedPost.imgSrc.replace("https://cb-candids.s3.ap-south-1.amazonaws.com/", "");
            aws.s3DeleteObject(curKey).then(data => {
                console.log(deletedPost.imgSrc, ' was deleted');
                res.status(200).json({
                    "success": true,
                });
            }).catch(err => {
                console.log(err)
                // TODO: Make this atomic operation
                // Error deleting the file, so revert the document deletion:
                // deletedPost.save().then(recoveredPost => console.log("recoveredPost ", recoveredPost))
                // .catch(err => console.log(err));
                // HELP: How should I handle this? 
                // Post document is deleted but there was an error deleting the file.
                // res.status(500).json({
                //     "success": false,
                //     "errors": err.message
                // });
                res.status(500).json({
                    "success": false,
                    "errors": err.message
                });
            })
        }
        else
            res.status(404).json({
                "success": false,
                "errors": "Post Not Found"
            });
    }).catch(err => {
        console.log(err)
        res.status(500).json({
            "success": false,
            "errors": err.message
        });
    })

});

// Edit Post:
postsRouter.patch("/:postId", jwtAuthCheck, authorizationCheck, upload.single('imgSrc'), async (req, res) => {
    const { postId } = req.params;
    const { title, description, taggedUsers } = req.body;
    const changes = {}, errors = {};

    if (description !== undefined)
        changes.description = description;

    if (title !== undefined)
        if (title !== "")
            changes.title = title;
        else
            errors.title = "Title is required";

    if (req.file !== undefined)
        changes.imgSrc = req.file.path;

    if (taggedUsers !== undefined) {
        try {
            // changes.taggedUsers = JSON.parse(taggedUsers.length === 0 ? "[]" : taggedUsers);
            changes.taggedUsers = JSON.parse(taggedUsers);
        } catch (err) {
            errors.taggedUsers = err.message
        };
    }

    if (!(Object.entries(errors).length === 0 && errors.constructor === Object)) {
        // Data is Invalid, respond immediately.
        // HELP: Should I send the response after deleting the temporary file? (202 Accepted?)
        res.status(422).json({
            "success": false,
            "errors": errors,
        });

        // Errors found, no need to keep the file:
        if (req.file)
            fs.unlink(req.file.path, (err) => {
                if (err) console.log("Error deleting the file: ", err);
                else console.log(req.file.path, ' was deleted');
            });

    } else if (!(Object.entries(changes).length === 0 && changes.constructor === Object)) {
        // TODO: Will this get into, Cannot set headers after...
        if (changes.imgSrc) {
            // Upload to S3:
            try {
                const location = await aws.s3Upload("posts/", changes.imgSrc);
                changes.imgSrc = location;
            } catch (err) {
                console.log(err)
                return res.status(500).json({
                    "success": false,
                    "errors": err.message
                });
            }
        }
        // Changes found, update the post:
        Post.findById(postId).then(curPost => {
            if (curPost) {
                const curKey = curPost.imgSrc.replace("https://cb-candids.s3.ap-south-1.amazonaws.com/", "");
                Object.assign(curPost, changes);
                curPost.save().then(updatedPost => {
                    console.log("Updated Post =>", updatedPost);
                    res.status(200).json({
                        "success": true,
                        "data": {
                            post: curPost
                        }
                    })
                    // If new file was uploaded, delete the old one:
                    if (req.file) {
                        // Deleting from AWS:
                        aws.s3DeleteObject(curKey);
                    }

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
                    "errors": "Post Not Found"
                });
            }
        }).catch(err => {
            console.log(err)
            res.status(500).json({
                "success": false,
                "errors": err.message
            });
        });
    } else {
        // HELP: Should I just remove the body?
        res.status(304).json({
            "success": false,
            "errors": "No changes"
        });
    }

});


// Like a Post
postsRouter.post("/:postId/likes", jwtAuthCheck, (req, res) => {
    const { postId } = req.params;
    Post.findById(postId).then(post => {
        if (post) {
            let message;
            const likeIndex = post.likes.indexOf(req.userId);
            if (likeIndex === -1) {
                message = "liked";
                post.likes.push(req.userId);
            }
            else {
                message = "unliked";
                post.likes.splice(likeIndex, 1);
            }

            post.save().then(updatedPost => {
                res.status(200).json({
                    "success": true,
                    "message": message
                });
            })
        }
        else
            res.status(404).json({
                "success": false,
                "errors": "Post Not Found",
            });
    }).catch(err => {
        console.log(err)
        res.status(500).json({
            "success": false,
            "errors": err.message
        });
    })

});

postsRouter.use("/:postId/comments", commentsRouter);

module.exports = postsRouter;
